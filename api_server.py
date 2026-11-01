"""
FastAPI Backend Server: Connects React frontend to RAG pipeline and Financial Analytics.
Exposes REST endpoints for KPIs, Analytics, Interactive Q&A, and PDF Processing.
"""

import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from financial_service import financial_service
from rag_engine import rag_engine

app = FastAPI(
    title="Financial RAG & Analytics API",
    description="Backend API for Automatic Financial Dashboard Generation and SEC 10-K RAG Analysis",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite dev server and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    top_k: int = 5
    document: Optional[str] = None


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[Dict[str, Any]]


@app.get("/api/health")
def health_check():
    """Returns system status, active models, and ChromaDB vector count."""
    count = rag_engine.collection.count()
    return {
        "status": "healthy",
        "chroma_chunks": count,
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "gemini_model": rag_engine.gemini_model,
        "primary_document": "Apple.pdf"
    }


@app.get("/api/documents")
def list_documents():
    """Lists available annual reports and indexed document summaries."""
    data_dir = Path("data")
    docs = []
    if data_dir.exists():
        for f in data_dir.glob("*.pdf"):
            docs.append({
                "filename": f.name,
                "size_kb": round(f.stat().st_size / 1024, 1),
                "last_modified": f.stat().st_mtime,
                "is_active": (f.name == "Apple.pdf")
            })

    return {
        "documents": docs,
        "active_document": "Apple.pdf",
        "total_vector_chunks": rag_engine.collection.count()
    }


@app.get("/api/financials")
def get_financials(doc: Optional[str] = Query(None)):
    """
    Returns verified audited financial KPIs, multi-year trend charts,
    financial ratios, and statement tables with citations.
    """
    try:
        # Currently loads Apple.pdf audited financials
        data = financial_service.get_apple_report_financials()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate financials: {str(e)}")


@app.post("/api/chat", response_model=ChatResponse)
def rag_chat(request: ChatRequest):
    """
    Processes financial questions through ChromaDB vector retrieval and Gemini answer generation.
    Returns the answer with source citations and cosine distances.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        retrieved_chunks = rag_engine.retrieve_chunks(
            question=request.question,
            top_k=request.top_k,
            document_filter=request.document
        )

        answer = rag_engine.generate_answer(
            question=request.question,
            retrieved_chunks=retrieved_chunks
        )

        return ChatResponse(
            question=request.question,
            answer=answer,
            sources=retrieved_chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Chat error: {str(e)}")


@app.post("/api/upload")
async def upload_annual_report(file: UploadFile = File(...)):
    """
    Uploads a new annual report PDF, parses markdown, splits into chunks,
    generates embeddings, indexes into ChromaDB, and extracts financial metrics.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)
    file_path = data_dir / file.filename

    # Save uploaded file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Index into ChromaDB
        index_result = rag_engine.process_and_index_pdf(file_path, file.filename)

        return {
            "message": f"Successfully uploaded and indexed '{file.filename}'.",
            "filename": file.filename,
            "total_chunks": index_result["total_chunks"],
            "total_collection_chunks": rag_engine.collection.count(),
            "status": "ready"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded PDF: {str(e)}")


# Serve production build if frontend/dist exists
frontend_dist = Path("frontend/dist")
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
