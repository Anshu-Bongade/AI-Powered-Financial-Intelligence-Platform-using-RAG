import os
import shutil
import tempfile
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MARKDOWN_DIR = BASE_DIR / "mark_down"
CHUNKS_DIR = BASE_DIR / "chunks"
CACHE_DIR = BASE_DIR / "financial_cache"

def _setup_writable_chroma_dir() -> Path:
    """
    Ensures ChromaDB has a 100% writable directory with writeable SQLite and WAL support.
    On cloud containers (Streamlit Cloud, Render, etc.), files cloned from git into /mount/src
    or /app may have read-only filesystem attributes or container UID permission mismatches,
    causing SQLite '(code: 1032) attempt to write a readonly database'.
    This copies the pre-indexed chroma_db to a writable temp directory if needed.
    """
    orig_chroma = BASE_DIR / "chroma_db"
    
    # Try testing write permissions on the original folder
    is_writable = False
    try:
        orig_chroma.mkdir(parents=True, exist_ok=True)
        test_file = orig_chroma / ".write_test"
        test_file.touch()
        test_file.unlink()
        
        # Test if chroma.sqlite3 exists and can be written to
        sqlite_file = orig_chroma / "chroma.sqlite3"
        if sqlite_file.exists():
            os.chmod(sqlite_file, 0o666)
            with open(sqlite_file, "a+b") as f:
                pass
        is_writable = True
    except Exception:
        is_writable = False

    if is_writable:
        return orig_chroma

    # Fallback: Copy ChromaDB into writable tempdir so SQLite has full WAL journal permissions
    target_dir = Path(tempfile.gettempdir()) / "finsight_chroma_db"
    if not target_dir.exists() or not (target_dir / "chroma.sqlite3").exists():
        if orig_chroma.exists():
            print(f"[Config] Copying ChromaDB from {orig_chroma} to writable location {target_dir}...")
            shutil.copytree(orig_chroma, target_dir, dirs_exist_ok=True)
        else:
            target_dir.mkdir(parents=True, exist_ok=True)

    # Recursively ensure full permissions
    for root, dirs, files in os.walk(target_dir):
        for d in dirs:
            try:
                os.chmod(os.path.join(root, d), 0o777)
            except Exception:
                pass
        for f in files:
            try:
                os.chmod(os.path.join(root, f), 0o666)
            except Exception:
                pass

    print(f"[Config] Using writable ChromaDB directory: {target_dir}")
    return target_dir

CHROMA_DIR = _setup_writable_chroma_dir()

for directory in [DATA_DIR, MARKDOWN_DIR, CHUNKS_DIR, CHROMA_DIR, CACHE_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

gemini_key = os.getenv("GEMINI_API_KEY", "")
if not gemini_key:
    try:
        import streamlit as st
        if hasattr(st, "secrets") and "GEMINI_API_KEY" in st.secrets:
            gemini_key = st.secrets["GEMINI_API_KEY"]
    except Exception:
        pass

GEMINI_API_KEY = gemini_key
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DEFAULT_COLLECTION_NAME = "apple_documents"
