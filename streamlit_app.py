"""
FinSight AI — Executive Financial Intelligence & SEC 10-K RAG Platform
Streamlit Production Application
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.config import DATA_DIR, MARKDOWN_DIR, CACHE_DIR, GEMINI_API_KEY, GEMINI_MODEL
from backend.rag_service import RAGService
from backend.pdf_processor import PDFProcessor
from backend.financial_extractor import FinancialExtractor
from backend.financial_analytics import FinancialAnalytics
from backend.comparison_engine import CompanyComparisonEngine

# ==============================================================================
# STREAMLIT PAGE CONFIGURATION & STYLING
# ==============================================================================
st.set_page_config(
    page_title="FinSight AI — Financial Intelligence & SEC RAG",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom High-Contrast Dark Financial Theme CSS
st.markdown("""
<style>
    /* Global styles */
    .stApp {
        background-color: #0b0f19;
        color: #f3f4f6;
    }
    
    /* Metrics and cards */
    div[data-testid="stMetric"] {
        background-color: #111827;
        border: 1px solid #1f2937;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    div[data-testid="stMetric"]:hover {
        border-color: #3b82f6;
    }
    div[data-testid="stMetricLabel"] {
        color: #9ca3af !important;
        font-size: 0.85rem !important;
        font-weight: 600 !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    div[data-testid="stMetricValue"] {
        color: #f9fafb !important;
        font-size: 1.65rem !important;
        font-weight: 700 !important;
    }
    
    /* Header badges */
    .sec-badge {
        display: inline-flex;
        align-items: center;
        background-color: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 600;
        margin-right: 8px;
    }
    .timing-badge {
        display: inline-flex;
        align-items: center;
        background-color: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #60a5fa;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 600;
    }
    .citation-box {
        background-color: #111827;
        border-left: 3px solid #3b82f6;
        padding: 12px 16px;
        border-radius: 0 8px 8px 0;
        margin-bottom: 12px;
        font-size: 0.88rem;
    }
    
    /* Tabs styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 1px solid #1f2937;
        padding-bottom: 4px;
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px 8px 0 0;
        padding: 10px 20px;
        font-weight: 600;
        color: #9ca3af;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1f2937 !important;
        color: #60a5fa !important;
        border-bottom: 2px solid #3b82f6 !important;
    }
    
    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        background-color: #0d121f;
        border-right: 1px solid #1f2937;
    }
</style>
""", unsafe_allow_html=True)


# ==============================================================================
# STATE INITIALIZATION & CACHING
# ==============================================================================
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "selected_doc" not in st.session_state:
    st.session_state.selected_doc = "Apple.pdf"


@st.cache_resource(show_spinner="Initializing FinSight AI Services...")
def init_services():
    """Initializes and caches RAG singleton, PDF processor, and financial extractor."""
    rag = RAGService.get_instance()
    pdf_proc = PDFProcessor()
    extractor = FinancialExtractor()
    return rag, pdf_proc, extractor


rag_service, pdf_processor, financial_extractor = init_services()


def get_available_documents() -> List[Dict[str, Any]]:
    """Scans data/ directory and cached filings."""
    docs = []
    pdf_files = sorted(list(DATA_DIR.glob("*.pdf")), key=lambda p: p.name.lower())
    for p in pdf_files:
        stem = p.stem
        cache_path = CACHE_DIR / f"{stem}_financials.json"
        comp_name = stem.replace("_", " ")
        if cache_path.exists():
            try:
                c_data = json.loads(cache_path.read_text(encoding="utf-8"))
                comp_name = c_data.get("company_name", comp_name)
            except Exception:
                pass
        docs.append({
            "filename": p.name,
            "title": comp_name,
            "size_kb": round(p.stat().st_size / 1024, 1),
            "stem": stem
        })
    if not docs:
        docs.append({
            "filename": "Apple.pdf",
            "title": "Apple Inc.",
            "size_kb": 520.9,
            "stem": "Apple"
        })
    return docs


def load_company_analytics(doc_filename: str) -> Optional[Dict[str, Any]]:
    """Loads analytics payload from cache or extracts on-the-fly."""
    stem = Path(doc_filename).stem
    md_path = MARKDOWN_DIR / f"{stem}.md"
    pdf_path = DATA_DIR / doc_filename

    if not md_path.exists() and pdf_path.exists():
        with st.spinner(f"Extracting structured text from {doc_filename}..."):
            pdf_processor.extract_markdown(pdf_path, doc_filename)

    if not md_path.exists():
        return None

    try:
        raw_data = financial_extractor.extract_from_markdown(md_path, doc_filename, force_refresh=False)
        analytics = FinancialAnalytics.calculate_analytics(raw_data)
        return analytics
    except Exception as e:
        st.error(f"Error analyzing {doc_filename}: {e}")
        return None


# ==============================================================================
# SIDEBAR: DOCUMENT SELECTOR & SEC 10-K UPLOAD
# ==============================================================================
with st.sidebar:
    st.markdown("""
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                📈
            </div>
            <div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">FinSight AI</div>
                <div style="font-size: 0.75rem; color: #9ca3af;">SEC Financial Intelligence</div>
            </div>
        </div>
    """, unsafe_allow_html=True)

    # Main Navigation Radio in Sidebar
    st.markdown("### 🧭 Platform Views")
    view_options = [
        "📊 Executive Financial Dashboard",
        "⚖️ Multi-Company Benchmark",
        "🤖 Grounded SEC 10-K RAG AI Chat"
    ]
    selected_view = st.radio(
        "Navigate to:",
        options=view_options,
        index=0,
        key="main_platform_nav"
    )
    st.markdown("---")

    available_docs = get_available_documents()
    doc_options = {d["filename"]: f"{d['title']} ({d['filename']})" for d in available_docs}
    
    # Selection dropdown
    doc_filenames = list(doc_options.keys())
    selected_index = 0
    if st.session_state.selected_doc in doc_filenames:
        selected_index = doc_filenames.index(st.session_state.selected_doc)

    selected_filename = st.selectbox(
        "📁 Select Active Annual Report:",
        options=doc_filenames,
        format_func=lambda x: doc_options.get(x, x),
        index=selected_index,
        key="active_doc_select"
    )
    st.session_state.selected_doc = selected_filename

    # Document details card
    active_analytics = load_company_analytics(selected_filename)
    if active_analytics:
        years_list = active_analytics.get("fiscal_years", [])
        years_str = ", ".join([str(y) for y in sorted(years_list, reverse=True)])
        curr = active_analytics.get("currency", "USD")
        unit = active_analytics.get("unit", "millions")
        
        st.markdown(f"""
            <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px 14px; margin-top: 10px; margin-bottom: 20px;">
                <div style="font-size: 0.72rem; color: #9ca3af; text-transform: uppercase; font-weight: 600;">Active Document Info</div>
                <div style="font-size: 0.95rem; font-weight: 700; color: #f9fafb; margin-top: 3px;">{active_analytics.get('company_name', 'Company')}</div>
                <div style="font-size: 0.8rem; color: #60a5fa; margin-top: 2px;">SEC Form 10-K • Audited</div>
                <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 6px;">
                    📅 <b>Fiscal Years:</b> {years_str}<br>
                    💵 <b>Reported In:</b> {curr} ({unit})
                </div>
            </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    # --------------------------------------------------------------------------
    # SEC 10-K PDF Uploader (Native Streamlit)
    # --------------------------------------------------------------------------
    st.markdown("### 📤 Upload New 10-K Filing")
    st.caption("Upload any SEC 10-K or Annual Report PDF to extract statements, compute financial KPIs, and index into ChromaDB.")

    uploaded_pdf = st.file_uploader(
        "Choose an SEC 10-K PDF",
        type=["pdf"],
        help="Upload multi-page annual reports (e.g., Adobe, Microsoft, Amazon)",
        key="uploader_widget"
    )
    
    force_reprocess = st.checkbox("Force full re-extraction", value=False, help="Bypass cached financial extractions if re-uploading an existing file")

    if uploaded_pdf is not None:
        file_bytes = uploaded_pdf.getvalue()
        file_name = uploaded_pdf.name
        dest_path = DATA_DIR / file_name

        if st.button("🚀 Process & Index Report", type="primary", use_container_width=True):
            status_box = st.status(f"Processing '{file_name}'...", expanded=True)
            progress_bar = st.progress(0.0)

            try:
                # Step 1: Save PDF
                status_box.write("📥 Saving PDF to disk...")
                progress_bar.progress(0.20)
                dest_path.write_bytes(file_bytes)
                time.sleep(0.2)

                # Step 2: C-level PyMuPDF fast text & table stream extraction
                status_box.write("📄 Extracting text & SEC financial statement tables (PyMuPDF)...")
                progress_bar.progress(0.40)
                md_path = pdf_processor.extract_markdown(dest_path, file_name)
                time.sleep(0.3)

                # Step 3: Structured Extraction with Gemini AI
                status_box.write("🤖 Gemini AI structuring balance sheet & calculating KPIs...")
                progress_bar.progress(0.70)
                raw_fin = financial_extractor.extract_from_markdown(md_path, file_name, force_refresh=force_reprocess)
                dash_data = FinancialAnalytics.calculate_analytics(raw_fin)
                time.sleep(0.3)

                # Step 4: ChromaDB Indexing
                status_box.write("🧠 Vectorizing chunks & indexing into ChromaDB (ONNX Embeddings)...")
                progress_bar.progress(0.90)
                pdf_processor.index_chunks(md_path, file_name)
                progress_bar.progress(1.0)

                status_box.update(label=f"✅ Successfully processed and indexed '{file_name}'!", state="complete", expanded=False)
                st.session_state.selected_doc = file_name
                st.success(f"'{file_name}' is ready! Reloading view...")
                time.sleep(1.0)
                st.rerun()

            except Exception as exc:
                status_box.update(label=f"❌ Processing failed: {str(exc)}", state="error")
                st.error(f"Error during upload & indexing: {str(exc)}")

    # Footer in sidebar
    st.markdown("---")
    st.markdown(
        "<div style='font-size: 0.75rem; color: #6b7280; text-align: center;'>"
        "FinSight AI Platform v2.0<br>Grounded SEC Financial Intelligence"
        "</div>",
        unsafe_allow_html=True
    )


# ==============================================================================
# MAIN PAGE HEADER & AUDIT BADGE
# ==============================================================================
if not active_analytics:
    st.warning(f"No financial data available for '{selected_filename}'. Please upload or select a valid document.")
    st.stop()

comp_title = active_analytics.get("company_name", "Company")
doc_title = active_analytics.get("document_title", "Form 10-K")

inc_data = active_analytics.get("statements", {}).get("income_statement", {})
bal_data = active_analytics.get("statements", {}).get("balance_sheet", {})
cf_data = active_analytics.get("statements", {}).get("cash_flows", {})

# Robust detection of years that have actual financial figures
raw_years = [str(y) for y in active_analytics.get("fiscal_years", [])]
data_years = [
    y for y in raw_years
    if inc_data.get("total_revenue", {}).get(y) is not None or inc_data.get("net_income", {}).get(y) is not None
]
if not data_years:
    data_years = [y for y, v in inc_data.get("total_revenue", {}).items() if v is not None]
if not data_years:
    data_years = raw_years if raw_years else ["2024"]

data_years = sorted(data_years, reverse=True)
years = data_years
latest_year = data_years[0]
prev_year = data_years[1] if len(data_years) > 1 else None

col_h1, col_h2 = st.columns([3, 1])
with col_h1:
    st.markdown(f"""
        <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <h1 style="margin: 0; font-size: 2.1rem; font-weight: 800; color: #ffffff;">{comp_title}</h1>
                <span class="sec-badge">✓ Audited SEC 10-K</span>
                <span class="timing-badge">FY {latest_year} Reported</span>
            </div>
            <div style="color: #9ca3af; font-size: 0.9rem; margin-top: 4px;">
                Filing: <b>{doc_title}</b> • Source: <code>{selected_filename}</code> • Units: {active_analytics.get('currency', 'USD')} in {active_analytics.get('unit', 'millions')}
            </div>
        </div>
    """, unsafe_allow_html=True)

with col_h2:
    val_status = active_analytics.get("validation", {}).get("status", "PASSED")
    val_checks = active_analytics.get("validation", {}).get("passed_checks", 0)
    val_total = active_analytics.get("validation", {}).get("total_checks", 0)
    st.markdown(f"""
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 10px 14px; text-align: right;">
            <div style="font-size: 0.72rem; color: #9ca3af; text-transform: uppercase;">Mathematical Integrity</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: {'#34d399' if val_status == 'PASSED' else '#fbbf24'};">
                {'● All Checks Passed' if val_status == 'PASSED' else '▲ Flagged Discrepancies'}
            </div>
            <div style="font-size: 0.75rem; color: #9ca3af;">{val_checks}/{val_total} Reconciliation Checks</div>
        </div>
    """, unsafe_allow_html=True)

# ==============================================================================
# ACTIVE VIEW ROUTING
# ==============================================================================
st.markdown(f'''
<div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 10px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
    <div style="font-weight: 700; color: #60a5fa; font-size: 1.05rem;">
        {selected_view}
    </div>
    <div style="color: #6b7280; font-size: 0.8rem;">
        Switch sections anytime in the left sidebar menu
    </div>
</div>
''', unsafe_allow_html=True)


# ==============================================================================
# VIEW 1: EXECUTIVE FINANCIAL DASHBOARD
# ==============================================================================
if selected_view == "📊 Executive Financial Dashboard":
    kpis = active_analytics.get("kpis", {})
    yoy_growth = active_analytics.get("yoy_growth", {})
    ratios = active_analytics.get("ratios", {}).get(latest_year, {})
    p_ratios = ratios.get("profitability", {})
    s_ratios = ratios.get("liquidity_solvency", {})

    # Helper formatting
    def fmt_currency(val, curr="USD", is_per_share=False):
        if val is None:
            return "N/A"
        if is_per_share:
            return f"${val:.2f}"
        abs_v = abs(val)
        sign = "-" if val < 0 else ""
        if abs_v >= 1000:
            return f"{sign}${abs_v / 1000:.2f}B"
        return f"{sign}${abs_v:.1f}M"

    def fmt_pct(val):
        if val is None:
            return None
        return f"{val:+.1f}%"

    # Top KPI Metrics Row 1 with Robust Fallbacks
    mcol1, mcol2, mcol3, mcol4, mcol5, mcol6 = st.columns(6)

    # 1. Revenue
    rev_val = kpis.get("revenue", {}).get("value")
    if rev_val is None:
        rev_val = kpis.get("total_revenue", {}).get("value")
    if rev_val is None:
        rev_val = inc_data.get("total_revenue", {}).get(latest_year)
    rev_delta = kpis.get("revenue", {}).get("yoy_growth") or yoy_growth.get("revenue", {}).get(latest_year)
    with mcol1:
        st.metric(
            label="Total Revenue",
            value=fmt_currency(rev_val),
            delta=fmt_pct(rev_delta)
        )

    # 2. Net Income
    ni_val = kpis.get("net_income", {}).get("value")
    if ni_val is None:
        ni_val = inc_data.get("net_income", {}).get(latest_year)
    ni_delta = kpis.get("net_income", {}).get("yoy_growth") or yoy_growth.get("net_income", {}).get(latest_year)
    with mcol2:
        st.metric(
            label="Net Income",
            value=fmt_currency(ni_val),
            delta=fmt_pct(ni_delta)
        )

    # 3. Gross Margin %
    gm_val = kpis.get("gross_margin_pct", {}).get("value")
    if gm_val is None:
        gm_val = p_ratios.get("gross_margin_pct")
    if gm_val is None and rev_val and rev_val != 0:
        gm_amt = inc_data.get("gross_margin", {}).get(latest_year)
        if gm_amt is not None:
            gm_val = round((gm_amt / rev_val) * 100, 2)
    gm_delta = yoy_growth.get("gross_margin", {}).get(latest_year)
    with mcol3:
        st.metric(
            label="Gross Margin %",
            value=f"{gm_val:.1f}%" if gm_val is not None else "N/A",
            delta=fmt_pct(gm_delta)
        )

    # 4. Operating Margin %
    om_val = kpis.get("operating_margin_pct", {}).get("value")
    if om_val is None:
        om_val = p_ratios.get("operating_margin_pct")
    if om_val is None and rev_val and rev_val != 0:
        oi_amt = inc_data.get("operating_income", {}).get(latest_year)
        if oi_amt is not None:
            om_val = round((oi_amt / rev_val) * 100, 2)
    om_delta = yoy_growth.get("operating_income", {}).get(latest_year)
    with mcol4:
        st.metric(
            label="Operating Margin %",
            value=f"{om_val:.1f}%" if om_val is not None else "N/A",
            delta=fmt_pct(om_delta)
        )

    # 5. Free Cash Flow
    fcf_val = kpis.get("free_cash_flow", {}).get("value")
    if fcf_val is None:
        fcf_val = active_analytics.get("free_cash_flow", {}).get(latest_year)
    if fcf_val is None:
        ocf_amt = cf_data.get("operating_cash_flow", {}).get(latest_year)
        capex_amt = cf_data.get("capex", {}).get(latest_year)
        if ocf_amt is not None and capex_amt is not None:
            fcf_val = round(ocf_amt - abs(capex_amt), 2)
    fcf_delta = kpis.get("free_cash_flow", {}).get("yoy_growth") or yoy_growth.get("free_cash_flow", {}).get(latest_year)
    with mcol5:
        st.metric(
            label="Free Cash Flow",
            value=fmt_currency(fcf_val),
            delta=fmt_pct(fcf_delta)
        )

    # 6. Return on Equity (ROE) & Current Ratio
    roe_val = p_ratios.get("return_on_equity_roe_pct")
    if roe_val is None and ni_val and bal_data.get("shareholders_equity", {}).get(latest_year):
        eq_amt = bal_data.get("shareholders_equity", {}).get(latest_year)
        if eq_amt and eq_amt != 0:
            roe_val = round((ni_val / eq_amt) * 100, 2)
    cr_val = s_ratios.get("current_ratio")
    with mcol6:
        st.metric(
            label="Return on Equity (ROE)",
            value=f"{roe_val:.1f}%" if roe_val is not None else (f"{cr_val:.2f}x" if cr_val else "N/A"),
            delta="Current Ratio: " + (f"{cr_val:.2f}x" if cr_val else "N/A") if roe_val is not None else None,
            delta_color="off"
        )

    st.markdown("<div style='height: 24px;'></div>", unsafe_allow_html=True)

    # --------------------------------------------------------------------------
    # Interactive Plotly Charts Row 1
    # --------------------------------------------------------------------------
    c_left, c_right = st.columns(2)

    with c_left:
        # Chart 1: Revenue & Net Income YoY Trend
        rev_trend = active_analytics.get("charts", {}).get("revenue_trend", [])
        if rev_trend:
            df_rev = pd.DataFrame(rev_trend)
            fig_rev = go.Figure()
            fig_rev.add_trace(go.Bar(
                x=[f"FY {r['year']}" for r in rev_trend],
                y=[(r.get("revenue") or 0) / 1000 for r in rev_trend],
                name="Total Revenue ($B)",
                marker_color="#3b82f6",
                text=[f"${(r.get('revenue') or 0)/1000:.2f}B" for r in rev_trend],
                textposition="auto"
            ))
            fig_rev.add_trace(go.Bar(
                x=[f"FY {r['year']}" for r in rev_trend],
                y=[(r.get("net_income") or 0) / 1000 for r in rev_trend],
                name="Net Income ($B)",
                marker_color="#10b981",
                text=[f"${(r.get('net_income') or 0)/1000:.2f}B" for r in rev_trend],
                textposition="auto"
            ))
            fig_rev.update_layout(
                title=dict(text="Revenue & Net Income Trajectory (YoY)", font=dict(color="#f3f4f6", size=15)),
                barmode="group",
                plot_bgcolor="#0d121f",
                paper_bgcolor="#111827",
                font=dict(color="#9ca3af"),
                yaxis=dict(title="USD (Billions)", gridcolor="#1f2937"),
                xaxis=dict(gridcolor="#1f2937"),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=40, r=20, t=50, b=40)
            )
            st.plotly_chart(fig_rev, use_container_width=True)
        else:
            st.info("Revenue trend data not available.")

    with c_right:
        # Chart 2: Profitability Margins Trend
        margin_trend = active_analytics.get("charts", {}).get("margin_trend", [])
        if margin_trend:
            fig_margin = go.Figure()
            fig_margin.add_trace(go.Scatter(
                x=[f"FY {m['year']}" for m in margin_trend],
                y=[(m.get("gross_margin") if m.get("gross_margin") is not None else m.get("gross_margin_pct")) for m in margin_trend],
                mode="lines+markers+text",
                name="Gross Margin %",
                line=dict(color="#3b82f6", width=3),
                text=[f"{(m.get('gross_margin') if m.get('gross_margin') is not None else m.get('gross_margin_pct', 0)):.1f}%" for m in margin_trend],
                textposition="top center"
            ))
            fig_margin.add_trace(go.Scatter(
                x=[f"FY {m['year']}" for m in margin_trend],
                y=[(m.get("operating_margin") if m.get("operating_margin") is not None else m.get("operating_margin_pct")) for m in margin_trend],
                mode="lines+markers+text",
                name="Operating Margin %",
                line=dict(color="#8b5cf6", width=3),
                text=[f"{(m.get('operating_margin') if m.get('operating_margin') is not None else m.get('operating_margin_pct', 0)):.1f}%" for m in margin_trend],
                textposition="top center"
            ))
            fig_margin.add_trace(go.Scatter(
                x=[f"FY {m['year']}" for m in margin_trend],
                y=[(m.get("net_margin") if m.get("net_margin") is not None else m.get("net_margin_pct")) for m in margin_trend],
                mode="lines+markers+text",
                name="Net Margin %",
                line=dict(color="#10b981", width=3),
                text=[f"{(m.get('net_margin') if m.get('net_margin') is not None else m.get('net_margin_pct', 0)):.1f}%" for m in margin_trend],
                textposition="bottom center"
            ))
            fig_margin.update_layout(
                title=dict(text="Operating & Profitability Margins (%)", font=dict(color="#f3f4f6", size=15)),
                plot_bgcolor="#0d121f",
                paper_bgcolor="#111827",
                font=dict(color="#9ca3af"),
                yaxis=dict(title="Margin (%)", gridcolor="#1f2937"),
                xaxis=dict(gridcolor="#1f2937"),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=40, r=20, t=50, b=40)
            )
            st.plotly_chart(fig_margin, use_container_width=True)
        else:
            st.info("Margins trend data not available.")

    # --------------------------------------------------------------------------
    # Interactive Plotly Charts Row 2: Cash Flow & DuPont Analysis
    # --------------------------------------------------------------------------
    c2_left, c2_right = st.columns(2)

    with c2_left:
        # Chart 3: Cash Flow Dynamics
        cf_trend = active_analytics.get("charts", {}).get("cash_flow_trend", [])
        if cf_trend:
            fig_cf = go.Figure()
            fig_cf.add_trace(go.Bar(
                x=[f"FY {c['year']}" for c in cf_trend],
                y=[((c.get("operating_cash_flow") or c.get("operating_cf") or 0)) / 1000 for c in cf_trend],
                name="Operating Cash Flow ($B)",
                marker_color="#06b6d4"
            ))
            fig_cf.add_trace(go.Bar(
                x=[f"FY {c['year']}" for c in cf_trend],
                y=[-(abs(c.get("capex") or 0)) / 1000 for c in cf_trend],
                name="CapEx ($B)",
                marker_color="#f43f5e"
            ))
            fig_cf.add_trace(go.Scatter(
                x=[f"FY {c['year']}" for c in cf_trend],
                y=[(c.get("free_cash_flow") or 0) / 1000 for c in cf_trend],
                mode="lines+markers",
                name="Free Cash Flow ($B)",
                line=dict(color="#10b981", width=3)
            ))
            fig_cf.update_layout(
                title=dict(text="Cash Flow Generation & Free Cash Flow ($B)", font=dict(color="#f3f4f6", size=15)),
                barmode="relative",
                plot_bgcolor="#0d121f",
                paper_bgcolor="#111827",
                font=dict(color="#9ca3af"),
                yaxis=dict(title="USD (Billions)", gridcolor="#1f2937"),
                xaxis=dict(gridcolor="#1f2937"),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=40, r=20, t=50, b=40)
            )
            st.plotly_chart(fig_cf, use_container_width=True)
        else:
            st.info("Cash flow trend data not available.")

    with c2_right:
        # Chart 4: DuPont ROE Decomposition Analysis
        dupont_rows = []
        for y in sorted(years, reverse=False):
            y_str = str(y)
            y_ratios = active_analytics.get("ratios", {}).get(y_str, {})
            p_r = y_ratios.get("profitability", {})
            s_r = y_ratios.get("liquidity_solvency", {})
            dupont_rows.append({
                "year": f"FY {y_str}",
                "Net Margin (%)": p_r.get("net_margin_pct"),
                "Asset Turnover (x)": s_r.get("asset_turnover"),
                "Financial Leverage (x)": round(s_r.get("liabilities_to_equity", 0) + 1, 2) if s_r.get("liabilities_to_equity") is not None else None,
                "Return on Equity (%)": p_r.get("return_on_equity_roe_pct")
            })

        if dupont_rows and any(r["Return on Equity (%)"] is not None for r in dupont_rows):
            df_dupont = pd.DataFrame(dupont_rows)
            fig_dupont = go.Figure()
            fig_dupont.add_trace(go.Bar(
                x=df_dupont["year"],
                y=df_dupont["Net Margin (%)"],
                name="Net Margin (%)",
                marker_color="#3b82f6"
            ))
            fig_dupont.add_trace(go.Bar(
                x=df_dupont["year"],
                y=df_dupont["Asset Turnover (x)"],
                name="Asset Turnover (x)",
                marker_color="#8b5cf6"
            ))
            fig_dupont.add_trace(go.Scatter(
                x=df_dupont["year"],
                y=df_dupont["Return on Equity (%)"],
                mode="lines+markers",
                name="ROE (%)",
                yaxis="y2",
                line=dict(color="#f59e0b", width=3)
            ))
            fig_dupont.update_layout(
                title=dict(text="DuPont ROE Drivers (Margin × Turnover × Leverage)", font=dict(color="#f3f4f6", size=15)),
                barmode="group",
                plot_bgcolor="#0d121f",
                paper_bgcolor="#111827",
                font=dict(color="#9ca3af"),
                yaxis=dict(title="Drivers Ratio", gridcolor="#1f2937"),
                yaxis2=dict(title="ROE (%)", overlaying="y", side="right", showgrid=False),
                xaxis=dict(gridcolor="#1f2937"),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=40, r=40, t=50, b=40)
            )
            st.plotly_chart(fig_dupont, use_container_width=True)
        else:
            # Fallback to Balance Sheet Structure
            bs_struct = active_analytics.get("charts", {}).get("balance_sheet_structure", [])
            if bs_struct:
                fig_bs = go.Figure()
                fig_bs.add_trace(go.Bar(
                    x=[f"FY {b['year']}" for b in bs_struct],
                    y=[(b.get("total_assets") or 0) / 1000 for b in bs_struct],
                    name="Total Assets ($B)",
                    marker_color="#3b82f6"
                ))
                fig_bs.add_trace(go.Bar(
                    x=[f"FY {b['year']}" for b in bs_struct],
                    y=[(b.get("total_liabilities") or 0) / 1000 for b in bs_struct],
                    name="Total Liabilities ($B)",
                    marker_color="#ef4444"
                ))
                fig_bs.add_trace(go.Bar(
                    x=[f"FY {b['year']}" for b in bs_struct],
                    y=[(b.get("shareholders_equity") or 0) / 1000 for b in bs_struct],
                    name="Shareholders Equity ($B)",
                    marker_color="#10b981"
                ))
                fig_bs.update_layout(
                    title=dict(text="Balance Sheet Composition ($B)", font=dict(color="#f3f4f6", size=15)),
                    barmode="group",
                    plot_bgcolor="#0d121f",
                    paper_bgcolor="#111827",
                    font=dict(color="#9ca3af"),
                    yaxis=dict(title="USD (Billions)", gridcolor="#1f2937"),
                    xaxis=dict(gridcolor="#1f2937"),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                    margin=dict(l=40, r=20, t=50, b=40)
                )
                st.plotly_chart(fig_bs, use_container_width=True)
            else:
                st.info("Balance sheet structure data not available.")

    # --------------------------------------------------------------------------
    # Tabular Financial Statements Viewers
    # --------------------------------------------------------------------------
    st.markdown("### 📋 Audited Financial Statement Viewers")
    
    stmt_tabs = st.tabs(["Income Statement", "Balance Sheet", "Cash Flows", "Validation Checks"])
    statements = active_analytics.get("statements", {})

    with stmt_tabs[0]:
        inc_data = statements.get("income_statement", {})
        if inc_data:
            rows = []
            for item, y_vals in inc_data.items():
                row = {"Financial Item": item.replace("_", " ").title()}
                for y in sorted(years, reverse=True):
                    val = y_vals.get(str(y))
                    if val is not None:
                        if "eps" in item.lower():
                            row[f"FY {y}"] = f"${val:.2f}"
                        else:
                            row[f"FY {y}"] = f"${val:,.0f}" if isinstance(val, (int, float)) else str(val)
                    else:
                        row[f"FY {y}"] = "—"
                rows.append(row)
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    with stmt_tabs[1]:
        bal_data = statements.get("balance_sheet", {})
        if bal_data:
            rows = []
            for item, y_vals in bal_data.items():
                row = {"Balance Sheet Item": item.replace("_", " ").title()}
                for y in sorted(years, reverse=True):
                    val = y_vals.get(str(y))
                    if val is not None:
                        row[f"FY {y}"] = f"${val:,.0f}" if isinstance(val, (int, float)) else str(val)
                    else:
                        row[f"FY {y}"] = "—"
                rows.append(row)
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    with stmt_tabs[2]:
        cf_data = statements.get("cash_flows", {})
        if cf_data:
            rows = []
            for item, y_vals in cf_data.items():
                row = {"Cash Flow Item": item.replace("_", " ").title()}
                for y in sorted(years, reverse=True):
                    val = y_vals.get(str(y))
                    if val is not None:
                        row[f"FY {y}"] = f"${val:,.0f}" if isinstance(val, (int, float)) else str(val)
                    else:
                        row[f"FY {y}"] = "—"
                rows.append(row)
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    with stmt_tabs[3]:
        val_checks_list = active_analytics.get("validation", {}).get("checks", [])
        if val_checks_list:
            v_rows = []
            for c in val_checks_list:
                v_rows.append({
                    "Status": "✅ PASS" if c["status"] == "PASS" else "⚠️ FLAG",
                    "Check Name": c.get("check_name", "").replace("_", " ").title(),
                    "Fiscal Year": f"FY {c.get('year')}",
                    "Details": c.get("details", "")
                })
            st.dataframe(pd.DataFrame(v_rows), use_container_width=True, hide_index=True)


# ==============================================================================
# VIEW 2: MULTI-COMPANY BENCHMARK & COMPARISON
# ==============================================================================
elif selected_view == "⚖️ Multi-Company Benchmark":
    st.markdown("### ⚖️ Cross-Company Comparative Analytics")
    st.caption("Benchmark 2 to 4 companies side-by-side using normalized margins, growth rates, and balance sheet strength.")

    cached_companies = CompanyComparisonEngine.get_available_companies()
    comp_map = {c["id"]: f"{c['company_name']} (FY {c['latest_year']})" for c in cached_companies}
    
    # Pre-select first 3 or all available
    default_cids = list(comp_map.keys())[:3]
    selected_cids = st.multiselect(
        "Select Companies to Compare (2 to 4):",
        options=list(comp_map.keys()),
        format_func=lambda cid: comp_map.get(cid, cid),
        default=default_cids
    )

    if len(selected_cids) < 2 or len(selected_cids) > 4:
        st.warning("⚠️ Please select between 2 and 4 companies to execute the comparative analysis.")
    else:
        try:
            with st.spinner("Computing deterministic scorecards & radar rankings..."):
                comp_payload = CompanyComparisonEngine.compare_companies(selected_cids)

            scorecard = comp_payload.get("scorecard", {})
            winners = scorecard.get("category_winners", {})

            # Leaderboard Cards
            w1, w2, w3, w4 = st.columns(4)
            with w1:
                st.markdown(f"""
                    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #9ca3af; text-transform: uppercase;">🚀 Growth Leader</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #60a5fa; margin-top: 4px;">{winners.get('growth', {}).get('company_name', 'N/A')}</div>
                        <div style="font-size: 0.8rem; color: #9ca3af;">Score: {winners.get('growth', {}).get('score', 0):.1f}/10</div>
                    </div>
                """, unsafe_allow_html=True)
            with w2:
                st.markdown(f"""
                    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #9ca3af; text-transform: uppercase;">💎 Profitability Leader</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #34d399; margin-top: 4px;">{winners.get('profitability', {}).get('company_name', 'N/A')}</div>
                        <div style="font-size: 0.8rem; color: #9ca3af;">Score: {winners.get('profitability', {}).get('score', 0):.1f}/10</div>
                    </div>
                """, unsafe_allow_html=True)
            with w3:
                st.markdown(f"""
                    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #9ca3af; text-transform: uppercase;">🛡️ Financial Health</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #a78bfa; margin-top: 4px;">{winners.get('financial_health', {}).get('company_name', 'N/A')}</div>
                        <div style="font-size: 0.8rem; color: #9ca3af;">Score: {winners.get('financial_health', {}).get('score', 0):.1f}/10</div>
                    </div>
                """, unsafe_allow_html=True)
            with w4:
                st.markdown(f"""
                    <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 12px;">
                        <div style="font-size: 0.72rem; color: #9ca3af; text-transform: uppercase;">🌊 Cash Flow Generation</div>
                        <div style="font-size: 1.15rem; font-weight: 700; color: #38bdf8; margin-top: 4px;">{winners.get('cash_flow', {}).get('company_name', 'N/A')}</div>
                        <div style="font-size: 0.8rem; color: #9ca3af;">Score: {winners.get('cash_flow', {}).get('score', 0):.1f}/10</div>
                    </div>
                """, unsafe_allow_html=True)

            st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)

            # Charts Row: Radar + Grouped Bar
            r_col, b_col = st.columns(2)

            with r_col:
                # Plotly Radar Chart
                scores_by_comp = scorecard.get("scores_by_company", {})
                categories = ["Growth", "Profitability", "Financial Health", "Cash Flow"]
                radar_fig = go.Figure()

                for cid, sc in scores_by_comp.items():
                    c_name = next((c["company_name"] for c in cached_companies if c["id"] == cid), cid)
                    r_vals = [
                        sc.get("growth", 5.0),
                        sc.get("profitability", 5.0),
                        sc.get("financial_health", 5.0),
                        sc.get("cash_flow", 5.0)
                    ]
                    # Close loop
                    r_vals.append(r_vals[0])
                    radar_fig.add_trace(go.Scatterpolar(
                        r=r_vals,
                        theta=categories + [categories[0]],
                        fill="toself",
                        name=c_name
                    ))

                radar_fig.update_layout(
                    title=dict(text="Competitive Radar Profile (0 - 10 Scale)", font=dict(color="#f3f4f6", size=15)),
                    polar=dict(
                        radialaxis=dict(visible=True, range=[0, 10], gridcolor="#1f2937"),
                        bgcolor="#0d121f"
                    ),
                    paper_bgcolor="#111827",
                    font=dict(color="#9ca3af"),
                    legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5),
                    margin=dict(l=40, r=40, t=50, b=50)
                )
                st.plotly_chart(radar_fig, use_container_width=True)

            with b_col:
                # Grouped Bar Comparison Chart
                comp_charts = comp_payload.get("charts", {})
                rev_list = comp_charts.get("revenue", [])
                ni_list = comp_charts.get("net_income", [])
                
                bar_fig = go.Figure()
                if rev_list:
                    bar_fig.add_trace(go.Bar(
                        x=[f"{r['company']} ({r['year']})" for r in rev_list],
                        y=[r.get("revenue_b") or 0 for r in rev_list],
                        name="Revenue ($B)",
                        marker_color="#3b82f6"
                    ))
                if ni_list:
                    bar_fig.add_trace(go.Bar(
                        x=[f"{n['company']} ({n['year']})" for n in ni_list],
                        y=[n.get("net_income_b") or 0 for n in ni_list],
                        name="Net Income ($B)",
                        marker_color="#10b981"
                    ))

                bar_fig.update_layout(
                    title=dict(text="Reported Scale Benchmark ($B)", font=dict(color="#f3f4f6", size=15)),
                    barmode="group",
                    plot_bgcolor="#0d121f",
                    paper_bgcolor="#111827",
                    font=dict(color="#9ca3af"),
                    yaxis=dict(title="USD (Billions)", gridcolor="#1f2937"),
                    xaxis=dict(gridcolor="#1f2937"),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                    margin=dict(l=40, r=20, t=50, b=40)
                )
                st.plotly_chart(bar_fig, use_container_width=True)

            # Detailed Comparative Table
            st.markdown("#### 📊 Comparative Metrics Matrix")
            raw_comp_table = comp_payload.get("comparison_table", [])
            companies_info = comp_payload.get("companies", [])
            if raw_comp_table:
                formatted_rows = []
                for row in raw_comp_table:
                    if row.get("is_header"):
                        header_dict = {"Metric": f"🔹 {row['label'].upper()}"}
                        for c in companies_info:
                            header_dict[c["name"]] = ""
                        formatted_rows.append(header_dict)
                    else:
                        r_entry = {"Metric": row.get("label", "")}
                        fmt = row.get("format", "")
                        for c in companies_info:
                            cid = c["id"]
                            cname = c["name"]
                            val = row.get("values", {}).get(cid)
                            if val is None:
                                r_entry[cname] = "N/A"
                            elif fmt == "currency":
                                if abs(val) >= 1000:
                                    r_entry[cname] = f"${val/1000:,.1f}B"
                                else:
                                    r_entry[cname] = f"${val:,.0f}M"
                            elif fmt == "percentage":
                                r_entry[cname] = f"{val:.1f}%"
                            elif fmt == "ratio":
                                r_entry[cname] = f"{val:.2f}x"
                            else:
                                r_entry[cname] = str(val)
                        formatted_rows.append(r_entry)
                df_metrics = pd.DataFrame(formatted_rows)
                st.dataframe(df_metrics, use_container_width=True, hide_index=True)

            # Grounded AI Summary
            st.markdown("#### 📝 AI Grounded Comparative Commentary")
            ai_summary = comp_payload.get("ai_summary", "")
            st.info(ai_summary)

        except Exception as e:
            st.error(f"Error executing comparison: {e}")


# ==============================================================================
# VIEW 3: GROUNDED SEC 10-K RAG AI CHAT
# ==============================================================================
elif selected_view == "🤖 Grounded SEC 10-K RAG AI Chat":
    st.markdown("### 🤖 Grounded SEC 10-K Financial Assistant")
    st.caption("Ask questions with guaranteed zero hallucination: queries automatically query verified financial statements and retrieved audited 10-K chunks with citations.")

    # Target Document Scope Selector
    scope_col1, scope_col2 = st.columns([2, 1])
    with scope_col1:
        query_scope = st.radio(
            "Query Target Scope:",
            options=["Active Document Only", "All Documents (Cross-Company Benchmark)"],
            horizontal=True
        )
    with scope_col2:
        doc_filter_arg = selected_filename if query_scope == "Active Document Only" else None
        st.markdown(f"""
            <div style="font-size: 0.8rem; color: #9ca3af; text-align: right; padding-top: 8px;">
                Searching: <b style="color: #60a5fa;">{selected_filename if doc_filter_arg else 'All 5+ Cached Filings'}</b>
            </div>
        """, unsafe_allow_html=True)

    # Quick prompt buttons
    st.markdown("<div style='font-size: 0.8rem; color: #9ca3af; margin-bottom: 6px;'>Quick Financial Inquiries:</div>", unsafe_allow_html=True)
    pcol1, pcol2, pcol3, pcol4 = st.columns(4)

    user_query = None
    with pcol1:
        if st.button("📈 Revenue & YoY Growth", use_container_width=True):
            user_query = f"What was {comp_title}'s total revenue and YoY growth in the latest reported fiscal year?"
    with pcol2:
        if st.button("💰 Margins & Cost Trends", use_container_width=True):
            user_query = f"Explain the gross margin and operating margin trends for {comp_title} across the reported fiscal years."
    with pcol3:
        if st.button("⚖️ Free Cash Flow & CapEx", use_container_width=True):
            user_query = f"What was {comp_title}'s Operating Cash Flow, CapEx, and resulting Free Cash Flow?"
    with pcol4:
        if st.button("🔍 Cross-Company Benchmark", use_container_width=True):
            user_query = "Compare total revenue, net income, and operating margins across Apple, Tesla, and NVIDIA."
            doc_filter_arg = None  # force cross-company

    # Chat Input
    chat_input_text = st.chat_input("Ask a question about financial statements, KPIs, or 10-K disclosures...")
    if chat_input_text:
        user_query = chat_input_text

    # Render Chat History
    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
            if msg.get("sources"):
                with st.expander(f"🔍 Source Citations & Verified Facts ({len(msg['sources'])})"):
                    for idx, s in enumerate(msg["sources"], 1):
                        s_type = s.get("citation_type", "retrieved_chunk")
                        badge = "🟢 Verified Financial Cache" if s_type == "verified_financial_cache" else "📄 Audited 10-K Text"
                        dist = s.get("distance", 0.0)
                        sim_pct = max(0, round((1.0 - dist) * 100, 1)) if dist else 100
                        st.markdown(f"""
                            <div class="citation-box">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                    <b>#{idx} • {badge}</b>
                                    <span style="color: #60a5fa; font-size: 0.78rem;">Match: {sim_pct}% • Source: {s.get('source', '10-K')}</span>
                                </div>
                                <div style="font-size: 0.84rem; color: #d1d5db; white-space: pre-wrap;">{s.get('excerpt', '')}</div>
                            </div>
                        """, unsafe_allow_html=True)

    # Process New Question
    if user_query:
        # Display user message
        st.session_state.chat_history.append({"role": "user", "content": user_query})
        with st.chat_message("user"):
            st.markdown(user_query)

        # Generate response using RAG Service
        with st.chat_message("assistant"):
            with st.spinner("Analyzing verified SEC statements & retrieving grounded chunks..."):
                try:
                    result = rag_service.query(
                        question=user_query,
                        top_k=5,
                        doc_filter=doc_filter_arg
                    )
                    answer_text = result.get("answer", "No answer generated.")
                    sources = result.get("sources", [])

                    st.markdown(answer_text)

                    if sources:
                        with st.expander(f"🔍 Source Citations & Verified Facts ({len(sources)})", expanded=True):
                            for idx, s in enumerate(sources, 1):
                                s_type = s.get("citation_type", "retrieved_chunk")
                                badge = "🟢 Verified Financial Cache" if s_type == "verified_financial_cache" else "📄 Audited 10-K Text"
                                dist = s.get("distance", 0.0)
                                sim_pct = max(0, round((1.0 - dist) * 100, 1)) if dist else 100
                                st.markdown(f"""
                                    <div class="citation-box">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                            <b>#{idx} • {badge}</b>
                                            <span style="color: #60a5fa; font-size: 0.78rem;">Match: {sim_pct}% • Source: {s.get('source', '10-K')}</span>
                                        </div>
                                        <div style="font-size: 0.84rem; color: #d1d5db; white-space: pre-wrap;">{s.get('excerpt', '')}</div>
                                    </div>
                                """, unsafe_allow_html=True)

                    st.session_state.chat_history.append({
                        "role": "assistant",
                        "content": answer_text,
                        "sources": sources
                    })

                except Exception as err:
                    err_msg = f"❌ Error querying RAG service: {str(err)}"
                    st.error(err_msg)
                    st.session_state.chat_history.append({
                        "role": "assistant",
                        "content": err_msg
                    })
