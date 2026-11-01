import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MARKDOWN_DIR = BASE_DIR / "mark_down"
CHUNKS_DIR = BASE_DIR / "chunks"
CHROMA_DIR = BASE_DIR / "chroma_db"
CACHE_DIR = BASE_DIR / "financial_cache"

for directory in [DATA_DIR, MARKDOWN_DIR, CHUNKS_DIR, CHROMA_DIR, CACHE_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_COLLECTION_NAME = "apple_documents"
