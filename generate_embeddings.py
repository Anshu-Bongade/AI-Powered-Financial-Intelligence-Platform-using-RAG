from pathlib import Path
import re

import chromadb
from sentence_transformers import SentenceTransformer

# 1. Define paths
input_path = Path("chunks/Apple_chunks.txt")
db_path = "chroma_db"

# 2. Read the existing chunks file
if not input_path.exists():
    raise FileNotFoundError(
        f"Chunks file not found: {input_path}. "
        "Run chunk_text.py first."
    )

content = input_path.read_text(encoding="utf-8")

# 3. Extract the actual text of each chunk
chunks = re.split(
    r"\n={10,}\s*\nCHUNK \d+ \| Characters: \d+\n={10,}\s*\n",
    content
)

chunks = [chunk.strip() for chunk in chunks if chunk.strip()]

if not chunks:
    raise ValueError(
        "No chunks were found. Check the format of Apple_chunks.txt."
    )

print(f"Total chunks loaded: {len(chunks)}")

# 4. Load the embedding model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# 5. Generate embeddings
embeddings = model.encode(
    chunks,
    normalize_embeddings=True,
    show_progress_bar=True
)

print(f"Embedding dimensions: {embeddings.shape[1]}")

# 6. Create persistent ChromaDB storage
client = chromadb.PersistentClient(path=db_path)

collection = client.get_or_create_collection(
    name="apple_documents",
    metadata={"hnsw:space": "cosine"}
)

# 7. Store chunks, embeddings, and metadata
batch_size = 100

for start in range(0, len(chunks), batch_size):
    end = min(start + batch_size, len(chunks))

    ids = [
        f"apple_chunk_{i}"
        for i in range(start, end)
    ]

    metadatas = [
        {
            "source": "Apple.pdf",
            "chunk_index": i
        }
        for i in range(start, end)
    ]

    collection.upsert(
        ids=ids,
        documents=chunks[start:end],
        embeddings=embeddings[start:end].tolist(),
        metadatas=metadatas
    )

# 8. Verify storage
print("\nEmbeddings stored successfully!")
print(f"Database path: {Path(db_path).resolve()}")
print(f"Collection name: {collection.name}")
print(f"Total records stored: {collection.count()}")

# 9. Display one stored record
sample = collection.peek(limit=1)

if sample["ids"]:
    print("\nSample ID:", sample["ids"][0])
    print("Sample metadata:", sample["metadatas"][0])
    print("Sample text:", sample["documents"][0][:200])
