import chromadb
from sentence_transformers import SentenceTransformer


# Step 1: Load the embedding model
print("Loading embedding model...")

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


# Step 2: Connect to the existing ChromaDB database
client = chromadb.PersistentClient(path="chroma_db")


# Step 3: Access the existing collection
collection = client.get_collection(name="apple_documents")

print("\nConnected to ChromaDB successfully!")
print("Collection:", collection.name)
print("Total stored chunks:", collection.count())


# Step 4: Accept questions from the user
while True:
    question = input(
        "\nEnter your question (or type 'exit' to quit): "
    ).strip()

    if question.lower() == "exit":
        print("Exiting program...")
        break

    if not question:
        print("Please enter a valid question.")
        continue

    try:
        # Step 5: Convert the question into an embedding
        query_embedding = model.encode(
            question,
            normalize_embeddings=True
        ).tolist()

        # Step 6: Retrieve the top 5 most similar chunks
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(5, collection.count()),
            include=["documents", "metadatas", "distances"]
        )

        # Step 7: Display the retrieved chunks
        print("\n========== RETRIEVED CHUNKS ==========")

        documents = results["documents"][0]
        ids = results["ids"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        if not documents:
            print("No relevant chunks found.")
            continue

        for rank, document in enumerate(documents, start=1):
            metadata = metadatas[rank - 1] or {}
            distance = distances[rank - 1]

            print(f"\nRank: {rank}")
            print("Chunk ID:", ids[rank - 1])
            print("Source:", metadata.get("source", "Unknown"))
            print("Chunk Index:", metadata.get("chunk_index", "Unknown"))
            print(f"Cosine Distance: {distance:.4f}")

            # Simple keyword check for revenue-related questions
            keywords = [
                "revenue",
                "total net sales",
                "net sales",
                "391,035"
            ]

            if any(
                keyword in document.lower()
                for keyword in keywords
            ):
                print("Revenue-related content: Yes")
            else:
                print("Revenue-related content: Not detected")

            print("\nOriginal Text:")
            print(document)
            print("-" * 60)

        print("\n======================================")
        print("Lower distance generally indicates greater similarity.")

    except Exception as error:
        print("\nAn error occurred:", error)
