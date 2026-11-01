import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.config import DATA_DIR, MARKDOWN_DIR, GEMINI_MODEL
from backend.rag_service import RAGService
from backend.pdf_processor import PDFProcessor
from backend.financial_extractor import FinancialExtractor
from backend.financial_analytics import FinancialAnalytics
from backend.comparison_engine import CompanyComparisonEngine

app = FastAPI(
    title="Financial RAG & Analytics Dashboard API",
    description="Automatic Financial Dashboard Generation & RAG Q&A grounded in verified annual reports.",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request & Response Models
class ChatRequest(BaseModel):
    question: str = Field(..., description="Financial question to answer")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of source chunks to retrieve")
    doc_filter: Optional[str] = Field(default=None, description="Optional document filename filter")
    document: Optional[str] = Field(default=None, description="Alias for doc_filter (backwards compatibility)")

class ChatCitation(BaseModel):
    id: str
    source: str
    chunk_index: Any
    distance: float
    excerpt: str
    page_number: Optional[Any] = None
    section: Optional[str] = None
    citation_type: Optional[str] = "retrieved_chunk"

class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[ChatCitation]

class CompareRequest(BaseModel):
    companies: List[str] = Field(..., min_length=2, max_length=4, description="List of 2 to 4 company IDs to compare")

# Service accessors
def get_rag_service():
    return RAGService.get_instance()

def get_pdf_processor():
    return PDFProcessor()

def get_financial_extractor():
    return FinancialExtractor()

@app.get("/api/health")
def health_check():
    rag = get_rag_service()
    doc_count = len(list(DATA_DIR.glob("*.pdf")))
    return {
        "status": "healthy",
        "gemini_model": GEMINI_MODEL,
        "chroma_chunks_count": rag.collection.count(),
        "available_reports_count": doc_count,
        "collection_name": rag.collection.name
    }

@app.get("/api/documents")
def list_documents():
    """List all available annual reports in the system."""
    reports = []
    pdf_files = list(DATA_DIR.glob("*.pdf"))

    for pdf in pdf_files:
        stem = pdf.stem
        md_file = MARKDOWN_DIR / f"{stem}.md"
        size_kb = round(pdf.stat().st_size / 1024, 1)

        reports.append({
            "filename": pdf.name,
            "title": stem.replace("_", " "),
            "size_kb": size_kb,
            "has_markdown": md_file.exists(),
            "last_modified": pdf.stat().st_mtime
        })

    # Default to Apple.pdf if no others
    if not reports:
        reports.append({
            "filename": "Apple.pdf",
            "title": "Apple Inc. Form 10-K",
            "size_kb": 520.9,
            "has_markdown": True,
            "last_modified": 0
        })

    return {"documents": reports}

@app.delete("/api/documents/{filename}")
def delete_document(filename: str):
    """Delete an annual report PDF, its markdown, chunks, cache, and vector embeddings."""
    stem = Path(filename).stem
    deleted_files = []

    # 1. Delete PDF from data/
    pdf_path = DATA_DIR / filename
    if pdf_path.exists():
        pdf_path.unlink()
        deleted_files.append(str(pdf_path.name))

    # 2. Delete Markdown from mark_down/
    from backend.config import MARKDOWN_DIR, CHUNKS_DIR, CACHE_DIR
    md_path = MARKDOWN_DIR / f"{stem}.md"
    if md_path.exists():
        md_path.unlink()
        deleted_files.append(str(md_path.name))

    # 3. Delete chunks txt from chunks/
    chunks_path = CHUNKS_DIR / f"{stem}_chunks.txt"
    if chunks_path.exists():
        chunks_path.unlink()
        deleted_files.append(str(chunks_path.name))

    # 4. Delete cache JSON from financial_cache/
    cache_path = CACHE_DIR / f"{stem}_financials.json"
    if cache_path.exists():
        cache_path.unlink()
        deleted_files.append(str(cache_path.name))

    # 5. Delete vectors from ChromaDB collection
    rag = get_rag_service()
    deleted_chunks = 0
    try:
        # Delete by metadata source matching filename
        existing = rag.collection.get(where={"source": filename})
        if existing and existing.get("ids"):
            deleted_chunks = len(existing["ids"])
            rag.collection.delete(ids=existing["ids"])
    except Exception as e:
        print(f"[Delete] Warning: failed to delete from ChromaDB by source: {e}")
        # Fallback delete by doc_title
        try:
            existing = rag.collection.get(where={"doc_title": stem})
            if existing and existing.get("ids"):
                deleted_chunks = len(existing["ids"])
                rag.collection.delete(ids=existing["ids"])
        except Exception as e2:
            print(f"[Delete] Fallback deletion also failed: {e2}")

    return {
        "status": "success",
        "message": f"Successfully removed '{filename}'",
        "deleted_files": deleted_files,
        "deleted_chunks": deleted_chunks,
        "remaining_collection_chunks": rag.collection.count()
    }

@app.get("/api/financials")
def get_financial_dashboard(
    doc_name: str = Query(default="Apple.pdf", description="Filename of report to analyze"),
    force_refresh: bool = Query(default=False, description="Bypass cache and re-extract")
):
    """Retrieve full verified financial KPIs, ratios, YoY trends, and validation checks."""
    stem = Path(doc_name).stem
    md_path = MARKDOWN_DIR / f"{stem}.md"

    if not md_path.exists():
        # Check if PDF exists in data
        pdf_path = DATA_DIR / doc_name
        if not pdf_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Report file '{doc_name}' not found. Please upload it first."
            )
        # Extract markdown if missing
        processor = get_pdf_processor()
        processor.extract_and_index_pdf(pdf_path, doc_name)

    extractor = get_financial_extractor()
    raw_financials = extractor.extract_from_markdown(md_path, doc_name, force_refresh=force_refresh)
    analytics_payload = FinancialAnalytics.calculate_analytics(raw_financials)

    return analytics_payload

@app.post("/api/upload")
async def upload_annual_report(
    file: UploadFile = File(...),
    force_reprocess: bool = Query(default=False, description="Re-extract even if already cached")
):
    """Upload new annual report PDF, chunk & embed into ChromaDB, and extract financial KPIs.
    
    If the file was previously processed and cached, returns the cached result immediately
    unless force_reprocess=true is passed.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    stem = Path(file.filename).stem
    md_path = MARKDOWN_DIR / f"{stem}.md"
    from backend.config import CACHE_DIR
    cache_path = CACHE_DIR / f"{stem}_financials.json"

    # Save uploaded PDF to data directory
    destination = DATA_DIR / file.filename
    content = await file.read()
    destination.write_bytes(content)
    print(f"[Upload] Saved uploaded file to {destination} ({len(content)} bytes)")

    try:
        # ── Fast path: markdown + financial cache already exist ──────────────
        if md_path.exists() and cache_path.exists() and not force_reprocess:
            print(f"[Upload] Cache hit for '{file.filename}' — skipping re-extraction.")
            extractor = get_financial_extractor()
            raw_financials = extractor.extract_from_markdown(md_path, file.filename, force_refresh=False)
            dashboard_data = FinancialAnalytics.calculate_analytics(raw_financials)
            collection = get_rag_service().collection
            return {
                "status": "success",
                "message": f"'{file.filename}' was already indexed. Returned cached financial analytics.",
                "report": dashboard_data,
                "cached": True,
                "total_collection_chunks": collection.count()
            }

        # ── Full processing path ─────────────────────────────────────────────
        # Step 1: Extract text & tables via PyMuPDF4LLM, chunk, embed → ChromaDB
        processor = get_pdf_processor()
        proc_result = processor.extract_and_index_pdf(destination, file.filename)

        # Step 2: Extract structured financial statements & KPIs with Gemini AI
        extractor = get_financial_extractor()
        raw_financials = extractor.extract_from_markdown(md_path, file.filename, force_refresh=True)

        # Step 3: Run analytics, YoY growth, financial ratios & validations
        dashboard_data = FinancialAnalytics.calculate_analytics(raw_financials)
        collection = get_rag_service().collection

        return {
            "status": "success",
            "message": (
                f"Successfully processed '{file.filename}', "
                f"indexed {proc_result['total_chunks']} chunks into ChromaDB, "
                f"and generated financial analytics."
            ),
            "report": dashboard_data,
            "cached": False,
            "total_collection_chunks": collection.count()
        }

    except Exception as e:
        print(f"[Upload] Error processing file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and extract financial report: {str(e)}"
        )

@app.post("/api/chat", response_model=ChatResponse)
def rag_chat(request: ChatRequest):
    """Ask a question about the annual report with source citations and cosine distances."""
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    filter_doc = request.doc_filter or request.document

    rag = get_rag_service()
    result = rag.query(
        question=request.question,
        top_k=request.top_k,
        doc_filter=filter_doc
    )

    return ChatResponse(
        question=result["question"],
        answer=result["answer"],
        sources=[ChatCitation(**s) for s in result["sources"]]
    )

@app.get("/api/sample-queries")
def get_sample_queries():
    return {
        "queries": [
            "What was Apple's total net sales and net income in fiscal year 2024?",
            "How did Products vs Services revenue compare between 2022, 2023, and 2024?",
            "What are Apple's main operating expenses (R&D and SG&A)?",
            "What is Apple's Free Cash Flow and how is it calculated from operating activities and CapEx?",
            "What is Apple's total debt and cash & marketable securities position?",
            "Why is Apple's Return on Equity (ROE) over 150%?"
        ]
    }

# ── Company Comparison Endpoints ─────────────────────────────────────────────
@app.get("/api/companies")
def get_available_companies():
    """List all companies cached with valid financial extraction ready for comparison."""
    try:
        companies = CompanyComparisonEngine.get_available_companies()
        return {
            "status": "success",
            "count": len(companies),
            "companies": companies
        }
    except Exception as e:
        print(f"[API] Error fetching available companies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compare")
def compare_companies_endpoint(request: CompareRequest):
    """
    Deterministic comparison of 2 to 4 companies across growth, profitability,
    financial health, and cash flow with grounded AI summary.
    """
    if len(request.companies) < 2 or len(request.companies) > 4:
        raise HTTPException(status_code=400, detail="Please select between 2 and 4 companies to compare.")
    try:
        comparison_result = CompanyComparisonEngine.compare_companies(request.companies)
        return {
            "status": "success",
            "data": comparison_result
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[API] Error comparing companies: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate company comparison: {str(e)}")

# ── Static Frontend Serving (Unified Production Deployment) ──────────────────
DIST_DIR = BASE_DIR / "frontend" / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path == "api" or full_path.startswith("docs") or full_path.startswith("openapi"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
