# FinSight AI: Automatic Financial Dashboard & RAG Intelligence Engine

A full-stack, enterprise-grade financial analytics and RAG application that automatically extracts, audits, and visualizes financial KPIs from SEC Form 10-K annual reports using **FastAPI**, **React**, **ChromaDB**, **Sentence Transformers**, and **Gemini**.

---

## 🌟 Key Features

1. **Automatic Financial Dashboard Generation**
   - Automatically extracts audited financial figures from annual reports (Revenue, Net Income, Operating Income, Gross Margin, Operating Expenses, Balance Sheet Assets/Liabilities/Equity, Operating Cash Flow, CapEx, Free Cash Flow, and Diluted EPS).
   - Preserves reporting scale (USD Millions) and per-share precision.
   - Automatically parses multi-year comparisons (FY 2024, FY 2023, FY 2022).

2. **Python-Powered Financial Analytics & Ratios**
   - **Year-over-Year (YoY) Growth**: Revenue, Net Income, Operating Income, Gross Margin, and Free Cash Flow.
   - **Profitability Ratios**: Gross Margin %, Operating Margin %, Net Profit Margin %, ROA (Return on Assets), ROE (Return on Equity), R&D Intensity %.
   - **Liquidity & Solvency Ratios**: Current Ratio, Working Capital, Cash Ratio, Debt-to-Equity, Debt-to-Assets, Asset Turnover.
   - **Cash Quality Metrics**: Free Cash Flow ($FCF = OCF - |CapEx|$), FCF-to-Net Income Conversion Rate, Operating Cash Flow to Net Income.

3. **Data Accuracy & GAAP Validation Engine (Anti-Hallucination Policy)**
   - **Arithmetic Reconciliation**: 11 out of 11 GAAP checksums verified with **$0M discrepancy**:
     - Balance Sheet Equation: $\text{Assets} = \text{Liabilities} + \text{Equity}$
     - Gross Profit Reconciliation: $\text{Revenue} - \text{COGS} = \text{Gross Margin}$
     - Operating Profit Reconciliation: $\text{Gross Margin} - \text{OpEx} = \text{Operating Income}$
     - Free Cash Flow Formula: $\text{Operating Cash Flow} - |\text{CapEx}| = \text{Free Cash Flow}$
   - **Zero Synthetic Numbers**: Values not reported in the filing (e.g. SEC 10-K balance sheets only present 2 fiscal years) are explicitly flagged as `NOT_REPORTED` rather than fabricated or hallucinated.

4. **Modern React Frontend**
   - **Executive KPI Cards** with YoY trend arrows and badges.
   - **Interactive Recharts Visualizations**:
     - Multi-year Financial Performance (Revenue, Operating Income, Net Income)
     - Revenue Streams Breakdown (Products vs Services)
     - Margin Trajectory (Gross, Operating, Net Margin %)
     - Cash Flow Waterfall (Operating CF vs CapEx vs Free Cash Flow)
     - Capital Structure (Assets vs Liabilities & Equity)
   - **Consolidated Financial Tables** with tabbed navigation (Income Statement, Balance Sheet, Cash Flows) and SEC citation tags.
   - **Audit & Validation Panel** displaying all GAAP reconciliation results and missing value disclosures.
   - **PDF Upload Drawer** supporting drag-and-drop report ingestion with live pipeline status.
   - **RAG Chatbot Drawer** with interactive conversational QA and expandable source citations (document title, chunk ID, cosine similarity distance, and verified excerpt).

---

## 🏗️ Architecture

```
RAG_TEST/
├── backend/
│   ├── __init__.py
│   ├── config.py                 # Central configuration & paths
│   ├── main.py                   # FastAPI application with REST endpoints
│   ├── rag_service.py            # ChromaDB + SentenceTransformers + Gemini RAG
│   ├── pdf_processor.py          # PyMuPDF4LLM extraction, chunking & vector indexing
│   ├── financial_extractor.py    # Structured financial statement extraction with Gemini
│   ├── financial_analytics.py    # YoY growth, financial ratios & GAAP validation engine
│   └── test_pipeline.py          # Verification script
├── frontend/                     # React + Vite + Tailwind CSS + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation, doc selector, and action triggers
│   │   │   ├── KpiCards.jsx      # Executive KPI summary cards
│   │   │   ├── ChartsSection.jsx # 5 interactive Recharts views
│   │   │   ├── FinancialTables.jsx# Income, Balance Sheet & Cash Flow tables
│   │   │   ├── FinancialRatios.jsx# Categorized ratio cards with tooltips
│   │   │   ├── ValidationAudit.jsx# GAAP audit & anti-hallucination panel
│   │   │   ├── ChatbotDrawer.jsx # RAG Q&A with cosine distance citations
│   │   │   └── UploadModal.jsx   # PDF upload & processing pipeline modal
│   │   ├── services/api.js       # REST API client
│   │   ├── utils/formatters.js   # Currency, percentage & ratio formatters
│   │   ├── App.jsx               # Main React dashboard application
│   │   └── index.css             # Tailwind v4 theme styling
│   └── vite.config.js            # Vite configuration with /api proxy to FastAPI
├── data/                         # Annual report PDFs (e.g. Apple.pdf)
├── mark_down/                    # Markdown extracted from PDFs
├── chunks/                       # Chunked text for vector indexing
├── chroma_db/                    # Persistent vector database
└── financial_cache/              # Cached structured extraction JSON files
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Valid Gemini API key in `.env`:
  ```env
  GEMINI_API_KEY="your-gemini-api-key"
  ```

### 2. Start the FastAPI Backend
In the project root directory:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI documentation and Swagger UI will be available at:
`http://127.0.0.1:8000/docs`

### 3. Start the React Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and visit:
`http://127.0.0.1:5173/`

---

## 📡 Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, ChromaDB chunk count, active Gemini model |
| `GET` | `/api/documents` | Lists all indexed annual reports and PDF files |
| `GET` | `/api/financials?doc_name=Apple.pdf` | Returns verified KPIs, ratios, YoY trends, charts data & audit checks |
| `POST` | `/api/upload` | Uploads PDF, indexes vectors into ChromaDB, extracts KPIs & returns analytics |
| `POST` | `/api/chat` | RAG query returning grounded answer, cosine distances, and source excerpts |
| `GET` | `/api/sample-queries` | Curated sample queries for the financial assistant |

---

## 🧪 Testing & Verification

To run the end-to-end extraction and mathematical validation test:
```bash
python backend/test_pipeline.py
```

Expected output:
```
SUCCESS! Extracted and Analyzed.
Company: Apple Inc.
Currency & Unit: USD millions
Validation overall status: PASSED
Passed: 11/11
[PASS] Accounting Equation (Assets = Liabilities + Equity) (2024) - disc: 0
[PASS] Accounting Equation (Assets = Liabilities + Equity) (2023) - disc: 0
[PASS] Gross Profit Check (Revenue - Cost of Sales = Gross Margin) (2024) - disc: 0
[PASS] Operating Profit Check (Gross Margin - OpEx = Operating Income) (2024) - disc: 0
[PASS] Free Cash Flow Formula (Operating Cash Flow - |CapEx| = FCF) (2024) - disc: 0
```
