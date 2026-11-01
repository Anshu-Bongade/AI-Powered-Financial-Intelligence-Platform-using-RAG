"""
RAG Engine: Integrates ChromaDB, Sentence Transformers, and Gemini.
Preserves existing logic from rag_app.py, retrieve_chunks.py, and generate_embeddings.py.
"""

import os
import chromadb
from pathlib import Path
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pymupdf4llm

load_dotenv()


class RAGEngine:
    def __init__(self, chroma_path: str = "chroma_db", default_collection: str = "apple_documents"):
        self.chroma_path = chroma_path
        self.default_collection_name = default_collection
        self.api_key = os.getenv("GEMINI_API_KEY")

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

        # Initialize Gemini Client
        self.gemini_client = genai.Client(
            api_key=self.api_key,
            http_options=types.HttpOptions(timeout=60000)
        )
        self.gemini_model = "gemini-3.5-flash-lite"

        # Initialize Sentence Transformer
        print("[RAG Engine] Loading embedding model: sentence-transformers/all-MiniLM-L6-v2...")
        self.embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

        # Initialize ChromaDB
        print(f"[RAG Engine] Connecting to ChromaDB at '{chroma_path}'...")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name=default_collection,
            metadata={"hnsw:space": "cosine"}
        )
        print(f"[RAG Engine] Collection '{self.collection.name}' ready with {self.collection.count()} chunks.")

    def retrieve_chunks(self, question: str, top_k: int = 5, document_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant document chunks from ChromaDB with cosine distance.
        """
        if self.collection.count() == 0:
            return []

        # Convert question into normalized embedding
        query_embedding = self.embedding_model.encode(
            question,
            normalize_embeddings=True
        ).tolist()

        query_params = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, self.collection.count()),
            "include": ["documents", "metadatas", "distances"]
        }

        if document_filter:
            query_params["where"] = {"source": document_filter}

        try:
            results = self.collection.query(**query_params)
        except Exception:
            # Fallback if filter doesn't match or where clause issues
            query_params.pop("where", None)
            results = self.collection.query(**query_params)

        documents = results["documents"][0] if results.get("documents") else []
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []
        ids = results["ids"][0] if results.get("ids") else []

        retrieved_chunks = []
        for i, document in enumerate(documents):
            retrieved_chunks.append({
                "id": ids[i],
                "text": document,
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "distance": round(float(distances[i]), 4) if i < len(distances) else 0.0
            })

        return retrieved_chunks

    def generate_answer(self, question: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """
        Generates an accurate, grounded answer using Gemini with strict factual adherence.
        """
        if not retrieved_chunks:
            return "No relevant document chunks were retrieved from the knowledge base to answer this question."

        context_parts = []
        for chunk in retrieved_chunks:
            source = chunk["metadata"].get("source", "Unknown")
            chunk_index = chunk["metadata"].get("chunk_index", "Unknown")
            context_parts.append(
                f"[SOURCE: {source} | CHUNK: {chunk_index} | DISTANCE: {chunk['distance']}]\n{chunk['text']}"
            )

        context = "\n\n---\n\n".join(context_parts)

        prompt = f"""
You are a senior financial analyst and document question-answering assistant specializing in SEC filings and corporate annual reports.

Answer the user's question using ONLY the supplied document context.

Instructions:
1. Ground every claim directly in the document context.
2. DO NOT invent facts, numbers, dates, or citations.
3. If the context does not contain enough information to answer definitively, explicitly state that the answer cannot be determined from the retrieved excerpts.
4. Always preserve exact financial units (e.g. $ millions, %, per share) and mention the relevant fiscal year (e.g. 2024, 2023, 2022).
5. Explain financial changes clearly (e.g., mention one-off tax charges, product line growth drivers, or FX impacts when present in context).
6. Format your answer with clean markdown, bullet points for comparisons, and bold key metrics for readability.
7. Explicitly cite the source document and chunk indices in your answer where appropriate.

DOCUMENT CONTEXT:
-----------------
{context}

USER QUESTION:
{question}

ANSWER:
"""

        response = self.gemini_client.models.generate_content(
            model=self.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=750
            )
        )

        if not response.text:
            return "Gemini returned an empty response. Please try rephrasing your question."

        return response.text.strip()

    def process_and_index_pdf(self, pdf_path: Path, source_name: str) -> Dict[str, Any]:
        """
        Extracts markdown from an uploaded PDF, chunks text, creates embeddings,
        and indexes into ChromaDB.
        """
        markdown_dir = Path("mark_down")
        markdown_dir.mkdir(parents=True, exist_ok=True)
        markdown_file = markdown_dir / f"{Path(source_name).stem}.md"

        print(f"[RAG Engine] Extracting text from {pdf_path}...")
        markdown_text = pymupdf4llm.to_markdown(str(pdf_path))
        markdown_file.write_text(markdown_text, encoding="utf-8")

        print(f"[RAG Engine] Chunking text...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_text(markdown_text)

        if not chunks:
            raise ValueError("No text could be extracted or chunked from the PDF.")

        print(f"[RAG Engine] Generating embeddings for {len(chunks)} chunks...")
        embeddings = self.embedding_model.encode(
            chunks,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        clean_stem = re.sub(r"[^a-zA-Z0-9_]", "_", Path(source_name).stem.lower())
        batch_size = 100

        for start in range(0, len(chunks), batch_size):
            end = min(start + batch_size, len(chunks))
            ids = [f"{clean_stem}_chunk_{i}" for i in range(start, end)]
            metadatas = [
                {
                    "source": source_name,
                    "chunk_index": i
                }
                for i in range(start, end)
            ]
            self.collection.upsert(
                ids=ids,
                documents=chunks[start:end],
                embeddings=embeddings[start:end].tolist(),
                metadatas=metadatas
            )

        print(f"[RAG Engine] Successfully stored {len(chunks)} chunks in ChromaDB for '{source_name}'.")

        return {
            "source_name": source_name,
            "total_chunks": len(chunks),
            "characters": len(markdown_text),
            "markdown_path": str(markdown_file)
        }


# Singleton instance
rag_engine = RAGEngine()
