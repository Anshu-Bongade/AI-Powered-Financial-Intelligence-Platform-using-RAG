from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. Define input and output paths
input_path = Path("mark_down/Apple.md")
output_path = Path("chunks/Apple_chunks.txt")

# 2. Read the Markdown file
if not input_path.exists():
    raise FileNotFoundError(
        f"Markdown file not found: {input_path}. "
        "Run extract_text.py first."
    )

markdown_text = input_path.read_text(encoding="utf-8")

# 3. Configure the text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
    separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""]
)

# 4. Split the Markdown into chunks
chunks = text_splitter.split_text(markdown_text)

# 5. Save all chunks to a text file
with output_path.open("w", encoding="utf-8") as file:
    for i, chunk in enumerate(chunks, start=1):
        file.write(f"\n{'=' * 30}\n")
        file.write(f"CHUNK {i} | Characters: {len(chunk)}\n")
        file.write(f"{'=' * 30}\n")
        file.write(chunk + "\n")

# 6. Display results
print("Text chunking completed successfully!")
print(f"Total characters in original text: {len(markdown_text)}")
print(f"Total chunks created: {len(chunks)}")
print(f"Chunks saved to: {output_path}")

# 7. Display the first three chunks
for i, chunk in enumerate(chunks[:3], start=1):
    print(f"\n{'=' * 20} CHUNK {i} {'=' * 20}")
    print(f"Characters: {len(chunk)}")
    print(chunk)
