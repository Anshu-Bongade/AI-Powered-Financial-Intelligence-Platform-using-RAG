import chromadb

# Connect to your local ChromaDB
client = chromadb.PersistentClient(path="chroma_db")

# Access your collection
collection = client.get_collection(name="apple_documents")

# Retrieve records
results = collection.get(
    limit=2,
    include=["documents", "metadatas", "embeddings"]
)

print("Collection:", collection.name)
print("Total records:", collection.count())

for i, chunk_id in enumerate(results["ids"]):
    print("\n" + "=" * 60)
    print("ID:", chunk_id)
    print("Document:", results["documents"][i][:300])
    print("Metadata:", results["metadatas"][i])
    print("Embedding dimensions:", len(results["embeddings"][i]))
    print("First 10 embedding values:", results["embeddings"][i][:10])
