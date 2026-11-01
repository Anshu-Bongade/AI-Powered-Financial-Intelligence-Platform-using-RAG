import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pymupdf4llm
from langchain_text_splitters import RecursiveCharacterTextSplitter
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

    def extract_and_index_pdf(self, pdf_path: Path, filename: str) -> Dict[str, Any]:
        """Process a PDF: extract to markdown, chunk, embed, and store in ChromaDB."""
        stem = Path(filename).stem
        markdown_path = MARKDOWN_DIR / f"{stem}.md"
        chunks_path = CHUNKS_DIR / f"{stem}_chunks.txt"

        # Step 1: Extract Markdown from PDF
        print(f"[PDFProcessor] Extracting markdown from {pdf_path}...")
        markdown_text = pymupdf4llm.to_markdown(str(pdf_path))
        markdown_path.write_text(markdown_text, encoding="utf-8")
        print(f"[PDFProcessor] Saved markdown to {markdown_path} ({len(markdown_text)} chars)")

        # Step 2: Chunk the Markdown text
        print("[PDFProcessor] Chunking markdown...")
        chunks = self.text_splitter.split_text(markdown_text)
        print(f"[PDFProcessor] Created {len(chunks)} chunks")

        # Step 3: Save chunk file (following existing project format)
        with chunks_path.open("w", encoding="utf-8") as f:
            for i, chunk in enumerate(chunks, start=1):
                f.write(f"\n{'=' * 30}\n")
                f.write(f"CHUNK {i} | Characters: {len(chunk)}\n")
                f.write(f"{'=' * 30}\n")
                f.write(chunk + "\n")

        # Step 4: Generate embeddings & store in ChromaDB
        print("[PDFProcessor] Generating embeddings and storing in ChromaDB...")
        embeddings = self.rag_service.embedding_model.encode(
            chunks,
            normalize_embeddings=True,
            show_progress_bar=False
        )

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

            collection.upsert(
                ids=ids,
                documents=chunks[start:end],
                embeddings=embeddings[start:end].tolist(),
                metadatas=metadatas
            )

        print(f"[PDFProcessor] Successfully stored {total_chunks} chunks in ChromaDB")

        return {
            "filename": filename,
            "markdown_path": str(markdown_path),
            "chunks_path": str(chunks_path),
            "total_chunks": total_chunks,
            "markdown_length": len(markdown_text)
        }
