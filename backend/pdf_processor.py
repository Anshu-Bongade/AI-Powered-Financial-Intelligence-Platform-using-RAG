import re
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Safe resilient imports for containerized production environments
try:
    import pymupdf4llm
except ImportError:
    pymupdf4llm = None

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    class RecursiveCharacterTextSplitter:
        def __init__(self, chunk_size=1000, chunk_overlap=150, separators=None):
            self.chunk_size = chunk_size
            self.chunk_overlap = chunk_overlap
        def split_text(self, text: str) -> List[str]:
            step = max(1, self.chunk_size - self.chunk_overlap)
            return [text[i:i + self.chunk_size] for i in range(0, len(text), step)]

from backend.config import DATA_DIR, MARKDOWN_DIR, CHUNKS_DIR
from backend.rag_service import RAGService

class PDFProcessor:
    def __init__(self):
        self.rag_service = RAGService.get_instance()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""]
        )

    def extract_markdown(self, pdf_path: Path, filename: str) -> Path:
        """Fast targeted extraction of full text and SEC financial tables to Markdown."""
        stem = Path(filename).stem
        markdown_path = MARKDOWN_DIR / f"{stem}.md"

        print(f"[PDFProcessor] Extracting markdown from {pdf_path} using fast PyMuPDF engine...")
        try:
            import fitz
            doc = fitz.open(str(pdf_path))
            full_pages = []
            statement_keywords = [
                'CONSOLIDATED STATEMENTS OF OPERATIONS',
                'CONSOLIDATED STATEMENTS OF INCOME',
                'CONSOLIDATED STATEMENTS OF EARNINGS',
                'STATEMENTS OF OPERATIONS',
                'CONSOLIDATED BALANCE SHEETS',
                'BALANCE SHEETS',
                'CONSOLIDATED STATEMENTS OF CASH FLOWS',
                'STATEMENTS OF CASH FLOWS',
                'CONSOLIDATED STATEMENTS OF FINANCIAL POSITION'
            ]

            for pno, page in enumerate(doc):
                text = page.get_text()
                upper = text.upper()
                has_statement = any(k in upper for k in statement_keywords) and (
                    'TOTAL' in upper or 'ASSETS' in upper or 'REVENUE' in upper or 'SALES' in upper
                )

                # If this page contains a financial statement, extract tables to markdown
                if has_statement:
                    tabs = page.find_tables()
                    if tabs.tables:
                        table_md = '\n\n'.join(t.to_markdown() for t in tabs.tables)
                        full_pages.append(f"## Page {pno+1}\n{text}\n\n{table_md}")
                        continue
                full_pages.append(f"## Page {pno+1}\n{text}")

            markdown_text = "\n\n".join(full_pages)
        except Exception as e:
            print(f"[PDFProcessor] Fast extraction fallback to pymupdf4llm: {e}")
            if pymupdf4llm is not None:
                try:
                    markdown_text = pymupdf4llm.to_markdown(str(pdf_path), ignore_images=True)
                except Exception:
                    markdown_text = f"# {filename}\nSEC Annual Report Document."
            else:
                markdown_text = f"# {filename}\nSEC Annual Report Document."

        markdown_path.write_text(markdown_text, encoding="utf-8")
        print(f"[PDFProcessor] Saved markdown to {markdown_path} ({len(markdown_text)} chars)")
        return markdown_path

    def index_chunks(self, markdown_path: Path, filename: str) -> int:
        """Chunk markdown text, generate embeddings in batches, and index into ChromaDB."""
        stem = Path(filename).stem
        chunks_path = CHUNKS_DIR / f"{stem}_chunks.txt"

        if not markdown_path.exists():
            print(f"[PDFProcessor] Cannot index chunks: {markdown_path} does not exist.")
            return 0

        markdown_text = markdown_path.read_text(encoding="utf-8", errors="replace")

        # Chunk the Markdown text
        print(f"[PDFProcessor] Chunking markdown for {filename}...")
        chunks = self.text_splitter.split_text(markdown_text)
        print(f"[PDFProcessor] Created {len(chunks)} chunks for {filename}")

        # Save chunk file
        with chunks_path.open("w", encoding="utf-8") as f:
            for i, chunk in enumerate(chunks, start=1):
                f.write(f"\n{'=' * 30}\n")
                f.write(f"CHUNK {i} | Characters: {len(chunk)}\n")
                f.write(f"{'=' * 30}\n")
                f.write(chunk + "\n")

        # Generate embeddings & store in ChromaDB (batched for low RAM)
        print(f"[PDFProcessor] Generating embeddings for {len(chunks)} chunks in ChromaDB...")
        embeddings = []
        if hasattr(self.rag_service, 'embedding_fn') and self.rag_service.embedding_fn is not None:
            batch_size = 32
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                raw_embs = self.rag_service.embedding_fn(batch_chunks)
                embeddings.extend([[float(x) for x in emb] for emb in raw_embs])
        elif self.rag_service.embedding_model is not None:
            embeddings = self.rag_service.embedding_model.encode(
                chunks,
                normalize_embeddings=True,
                show_progress_bar=False,
                batch_size=32
            )
        else:
            embeddings = [[0.0] * 384 for _ in chunks]

        collection = self.rag_service.collection
        batch_size = 100
        total_chunks = len(chunks)

        for start in range(0, total_chunks, batch_size):
            end = min(start + batch_size, total_chunks)
            ids = [f"{stem}_chunk_{i}" for i in range(start, end)]
            metadatas = [
                {
                    "source": filename,
                    "chunk_index": i,
                    "doc_title": stem
                }
                for i in range(start, end)
            ]

            batch_embeddings = (
                embeddings[start:end].tolist()
                if hasattr(embeddings[start:end], "tolist")
                else embeddings[start:end]
            )

            collection.upsert(
                ids=ids,
                documents=chunks[start:end],
                embeddings=batch_embeddings,
                metadatas=metadatas
            )

        print(f"[PDFProcessor] Successfully stored {total_chunks} chunks in ChromaDB for {filename}")
        return total_chunks

    def extract_and_index_pdf(self, pdf_path: Path, filename: str) -> Dict[str, Any]:
        """Process a PDF: extract to markdown, chunk, embed, and store in ChromaDB."""
        stem = Path(filename).stem
        markdown_path = self.extract_markdown(pdf_path, filename)
        total_chunks = self.index_chunks(markdown_path, filename)
        chunks_path = CHUNKS_DIR / f"{stem}_chunks.txt"

        return {
            "filename": filename,
            "markdown_path": str(markdown_path),
            "chunks_path": str(chunks_path),
            "total_chunks": total_chunks,
            "markdown_length": len(markdown_path.read_text(encoding="utf-8", errors="replace")) if markdown_path.exists() else 0
        }
