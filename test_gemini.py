import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY not found. Check your .env file."
    )

# Connect to Gemini API
client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(timeout=60000)
)

print("Testing Gemini API...")

try:
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents="Explain revenue in one simple sentence.",
        config=types.GenerateContentConfig(
            max_output_tokens=100,
            temperature=0.2
        )
    )

    print("\nGemini response:")
    print(response.text)

except Exception as error:
    print("\nGemini API request failed:")
    print(type(error).__name__)
    print(error)
