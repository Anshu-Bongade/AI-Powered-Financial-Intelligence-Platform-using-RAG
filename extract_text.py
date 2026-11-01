import pymupdf4llm
from pathlib import Path

# Input PDF path
pdf_path = Path("data/Apple.pdf")

# Output directory and Markdown file
output_dir = Path("mark_down")
output_dir.mkdir(parents=True, exist_ok=True)

output_path = output_dir / "Apple.md"

try:
    # Extract PDF content as Markdown
    markdown_text = pymupdf4llm.to_markdown(str(pdf_path))

    # Save the extracted content
    output_path.write_text(markdown_text, encoding="utf-8")

    print("PDF extraction completed successfully!")
    print(f"Markdown saved to: {output_path}")
    print(f"Total characters extracted: {len(markdown_text)}")

except FileNotFoundError:
    print(f"PDF not found: {pdf_path}")
    print("Check that Apple.pdf exists inside the data folder.")

except Exception as e:
    print(f"An error occurred: {e}")
