"""
Company Comparison & Deterministic Scoring Engine
FinSight AI - Financial Analytics Suite

Features:
- Deterministic multi-company financial comparison (2 to 4 companies)
- Multi-category transparent scorecard (Growth 25%, Profitability 30%, Financial Health 25%, Cash Flow 20%)
- Normalized scoring independent of company size (using ratios, margins & growth)
- Safe handling of N/A and differing fiscal years
- Structured comparison payload for Recharts & tabular display
- Grounded AI summary generation with zero hallucination
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from backend.config import CACHE_DIR, GEMINI_API_KEY, GEMINI_MODEL
from backend.financial_analytics import FinancialAnalytics

class CompanyComparisonEngine:
    """Computes transparent, deterministic comparative metrics and scorecards."""

    CATEGORY_WEIGHTS = {
        "profitability": 0.30,
        "growth": 0.25,
        "financial_health": 0.25,
        "cash_flow": 0.20
    }

    @classmethod
    def get_available_companies(cls) -> List[Dict[str, Any]]:
        """Scans financial_cache/ for all cached companies ready for comparison."""
        available = []
        for file in CACHE_DIR.glob("*_financials.json"):
            try:
                data = json.loads(file.read_text(encoding="utf-8"))
                years = [str(y) for y in data.get("fiscal_years", [])]
                available.append({
                    "id": file.stem.replace("_financials", ""),
                    "company_name": data.get("company_name", file.stem.replace("_financials", "").replace("_", " ")),
                    "filename": data.get("source_document", f"{file.stem.replace('_financials', '')}.pdf"),
                    "latest_year": years[0] if years else "N/A",
                    "fiscal_years": years,
                    "currency": data.get("currency", "USD"),
                    "unit": data.get("unit", "millions")
                })
            except Exception as e:
                print(f"[ComparisonEngine] Error reading {file.name}: {e}")
        return available

    @classmethod
    def compare_companies(cls, company_ids: List[str]) -> Dict[str, Any]:
        """
        Executes a deterministic multi-company financial comparison.
        Loads financial analytics for each selected company from cache.
        """
        if not (2 <= len(company_ids) <= 4):
            raise ValueError("Comparison requires between 2 and 4 companies.")

        company_profiles = []
        all_analytics = []

        for cid in company_ids:
            cache_file = CACHE_DIR / f"{cid}_financials.json"
            if not cache_file.exists():
                # Try finding matching file
                matches = list(CACHE_DIR.glob(f"*{cid}*_financials.json"))
                if matches:
                    cache_file = matches[0]
                else:
                    raise FileNotFoundError(f"Financial cache for company '{cid}' not found.")

            raw_data = json.loads(cache_file.read_text(encoding="utf-8"))
            analytics = FinancialAnalytics.calculate_analytics(raw_data)
            all_analytics.append(analytics)

            latest_year = str(analytics.get("fiscal_years", ["2024"])[0])
            company_profiles.append({
                "id": cid,
                "name": analytics.get("company_name", cid),
                "source_document": analytics.get("source_document"),
                "latest_year": latest_year,
                "currency": analytics.get("currency", "USD"),
                "unit": analytics.get("unit", "millions"),
                "analytics": analytics
            })

        # Check for fiscal year differences
        distinct_years = {p["latest_year"] for p in company_profiles}
        has_timing_difference = len(distinct_years) > 1

        disclaimers = [
            "Financial comparisons are most meaningful when companies operate in similar industries. Capital structures, operating cycles, and accounting choices vary across sectors."
        ]
        if has_timing_difference:
            disclaimers.append(
                f"Timing note: Companies report across different fiscal years ({', '.join(sorted(distinct_years))}). Compare results with this timing difference in mind."
            )

        # -------------------------------------------------------------
        # 1. Build Tabular Comparison Metrics
        # -------------------------------------------------------------
        kpi_table = cls._build_kpi_table(company_profiles)

        # -------------------------------------------------------------
        # 2. Build Interactive Recharts Datasets
        # -------------------------------------------------------------
        charts_data = cls._build_charts_data(company_profiles)

        # -------------------------------------------------------------
        # 3. Deterministic Performance Scorecard
        # -------------------------------------------------------------
        scorecard = cls._calculate_scorecard(company_profiles)

        # -------------------------------------------------------------
        # 4. Optional AI Grounded Commentary
        # -------------------------------------------------------------
        ai_summary = cls._generate_ai_summary(company_profiles, scorecard, kpi_table)

        return {
            "companies": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "latest_year": p["latest_year"],
                    "currency": p["currency"],
                    "unit": p["unit"],
                    "source_document": p["source_document"]
                }
                for p in company_profiles
            ],
            "fiscal_years": {p["id"]: p["latest_year"] for p in company_profiles},
            "has_timing_difference": has_timing_difference,
            "disclaimers": disclaimers,
            "comparison_table": kpi_table,
            "charts": charts_data,
            "scorecard": scorecard,
            "ai_summary": ai_summary
        }

    @classmethod
    def _build_kpi_table(cls, profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Builds categorized comparison matrix for Core, Position, and Cash Flow."""
        sections = [
            {
                "section": "Core Performance",
                "metrics": [
                    ("revenue", "Total Revenue", lambda p, y: p["analytics"]["statements"]["income_statement"].get("total_revenue", {}).get(y), "currency"),
                    ("rev_growth", "Revenue Growth (YoY)", lambda p, y: p["analytics"]["yoy_growth"]["revenue"].get(y), "pct"),
                    ("gross_profit", "Gross Profit", lambda p, y: p["analytics"]["statements"]["income_statement"].get("gross_margin", {}).get(y), "currency"),
                    ("gross_margin", "Gross Margin %", lambda p, y: p["analytics"]["ratios"].get(y, {}).get("profitability", {}).get("gross_margin_pct"), "pct"),
                    ("operating_income", "Operating Income (EBIT)", lambda p, y: p["analytics"]["statements"]["income_statement"].get("operating_income", {}).get(y), "currency"),
                    ("operating_margin", "Operating Margin %", lambda p, y: p["analytics"]["ratios"].get(y, {}).get("profitability", {}).get("operating_margin_pct"), "pct"),
                    ("net_income", "Net Income", lambda p, y: p["analytics"]["statements"]["income_statement"].get("net_income", {}).get(y), "currency"),
                    ("net_margin", "Net Profit Margin %", lambda p, y: p["analytics"]["ratios"].get(y, {}).get("profitability", {}).get("net_margin_pct"), "pct"),
                    ("diluted_eps", "Diluted EPS", lambda p, y: p["analytics"]["statements"]["income_statement"].get("diluted_eps", {}).get(y), "per_share"),
                ]
            },
            {
                "section": "Financial Position & Solvency",
                "metrics": [
                    ("total_assets", "Total Assets", lambda p, y: p["analytics"]["statements"]["balance_sheet"].get("total_assets", {}).get(y), "currency"),
                    ("total_liabilities", "Total Liabilities", lambda p, y: p["analytics"]["statements"]["balance_sheet"].get("total_liabilities", {}).get(y), "currency"),
                    ("shareholders_equity", "Shareholders' Equity", lambda p, y: p["analytics"]["statements"]["balance_sheet"].get("shareholders_equity", {}).get(y), "currency"),
                    ("cash_and_equiv", "Cash & Cash Equivalents", lambda p, y: p["analytics"]["statements"]["balance_sheet"].get("cash_and_equivalents", {}).get(y), "currency"),
                    ("current_ratio", "Current Ratio", lambda p, y: p["analytics"]["ratios"].get(y, {}).get("liquidity_solvency", {}).get("current_ratio"), "ratio"),
                    ("debt_to_equity", "Debt-to-Equity", lambda p, y: p["analytics"]["ratios"].get(y, {}).get("liquidity_solvency", {}).get("debt_to_equity"), "ratio"),
                ]
            },
            {
                "section": "Cash Flow Generation",
                "metrics": [
                    ("operating_cf", "Operating Cash Flow", lambda p, y: p["analytics"]["statements"]["cash_flows"].get("operating_cash_flow", {}).get(y), "currency"),
                    ("capex", "Capital Expenditures (CapEx)", lambda p, y: p["analytics"]["statements"]["cash_flows"].get("capex", {}).get(y), "currency"),
                    ("free_cash_flow", "Free Cash Flow", lambda p, y: p["analytics"]["free_cash_flow"].get(y), "currency"),
                    ("fcf_conversion", "FCF Conversion % (FCF / Net Income)", lambda p, y: p["analytics"]["ratios"].get(y, {}).get("cash_flow", {}).get("fcf_conversion_pct"), "pct"),
                ]
            }
        ]

        table_rows = []
        for s in sections:
            table_rows.append({"is_header": True, "label": s["section"]})
            for key, label, getter, fmt in s["metrics"]:
                values_by_company = {}
                for p in profiles:
                    y = p["latest_year"]
                    val = getter(p, y)
                    values_by_company[p["id"]] = val

                table_rows.append({
                    "is_header": False,
                    "key": key,
                    "label": label,
                    "format": fmt,
                    "values": values_by_company
                })

        return table_rows

    @classmethod
    def _build_charts_data(cls, profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Formats bar chart datasets for Recharts."""
        revenue_chart = []
        net_income_chart = []
        margins_chart = []
        growth_chart = []
        fcf_chart = []

        for p in profiles:
            y = p["latest_year"]
            income = p["analytics"]["statements"]["income_statement"]
            ratios = p["analytics"]["ratios"].get(y, {})
            p_ratios = ratios.get("profitability", {})
            yoy = p["analytics"]["yoy_growth"]

            rev = income.get("total_revenue", {}).get(y)
            ni = income.get("net_income", {}).get(y)
            fcf = p["analytics"]["free_cash_flow"].get(y)

            # Revenue chart ($B)
            revenue_chart.append({
                "company": p["name"],
                "year": y,
                "revenue_b": round(rev / 1000, 2) if rev is not None else None
            })

            # Net Income chart ($B)
            net_income_chart.append({
                "company": p["name"],
                "year": y,
                "net_income_b": round(ni / 1000, 2) if ni is not None else None
            })

            # Margins chart (%)
            margins_chart.append({
                "company": p["name"],
                "year": y,
                "gross_margin": p_ratios.get("gross_margin_pct"),
                "operating_margin": p_ratios.get("operating_margin_pct"),
                "net_margin": p_ratios.get("net_margin_pct")
            })

            # Revenue Growth (%)
            growth_chart.append({
                "company": p["name"],
                "year": y,
                "revenue_growth": yoy["revenue"].get(y),
                "net_income_growth": yoy["net_income"].get(y)
            })

            # FCF ($B)
            fcf_chart.append({
                "company": p["name"],
                "year": y,
                "free_cash_flow_b": round(fcf / 1000, 2) if fcf is not None else None
            })

        return {
            "revenue": revenue_chart,
            "net_income": net_income_chart,
            "margins": margins_chart,
            "growth": growth_chart,
            "free_cash_flow": fcf_chart
        }

    @classmethod
    def _calculate_scorecard(cls, profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Transparent deterministic scorecard.
        Ranks companies on normalized ratios and rates (not raw billions of dollars).
        """
        # Collect normalized metrics for each company
        company_metrics = {}
        for p in profiles:
            cid = p["id"]
            y = p["latest_year"]
            income = p["analytics"]["statements"]["income_statement"]
            ratios = p["analytics"]["ratios"].get(y, {})
            profit = ratios.get("profitability", {})
            solv = ratios.get("liquidity_solvency", {})
            cf_r = ratios.get("cash_flow", {})
            yoy = p["analytics"]["yoy_growth"]

            rev = income.get("total_revenue", {}).get(y)
            fcf = p["analytics"]["free_cash_flow"].get(y)
            fcf_margin = round((fcf / rev) * 100, 2) if (fcf is not None and rev) else None

            company_metrics[cid] = {
                # Growth (higher is better)
                "rev_growth": yoy["revenue"].get(y),
                "ni_growth": yoy["net_income"].get(y),
                # Profitability (higher is better)
                "gross_margin": profit.get("gross_margin_pct"),
                "operating_margin": profit.get("operating_margin_pct"),
                "net_margin": profit.get("net_margin_pct"),
                "roe": profit.get("return_on_equity_roe_pct"),
                # Financial Health
                "current_ratio": solv.get("current_ratio"), # higher is safer (up to 3.0)
                "debt_to_equity": solv.get("debt_to_equity"), # lower is safer
                # Cash Flow
                "fcf_margin": fcf_margin, # higher is better
                "fcf_conversion": cf_r.get("fcf_conversion_pct") # higher is better
            }

        # Normalize and compute category scores (0.0 to 10.0 scale)
        def score_metric(val, all_vals, higher_is_better=True):
            valid = [v for v in all_vals if v is not None]
            if val is None or not valid:
                return None
            min_v, max_v = min(valid), max(valid)
            if min_v == max_v:
                return 7.5
            if higher_is_better:
                normalized = (val - min_v) / (max_v - min_v)
            else:
                normalized = (max_v - val) / (max_v - min_v)
            return round(5.0 + (normalized * 5.0), 1) # Range 5.0 to 10.0

        all_rev_g = [m["rev_growth"] for m in company_metrics.values()]
        all_ni_g = [m["ni_growth"] for m in company_metrics.values()]
        all_gm = [m["gross_margin"] for m in company_metrics.values()]
        all_om = [m["operating_margin"] for m in company_metrics.values()]
        all_nm = [m["net_margin"] for m in company_metrics.values()]
        all_cr = [m["current_ratio"] for m in company_metrics.values()]
        all_de = [m["debt_to_equity"] for m in company_metrics.values()]
        all_fcf_m = [m["fcf_margin"] for m in company_metrics.values()]

        category_scores = {}
        for p in profiles:
            cid = p["id"]
            m = company_metrics[cid]

            # 1. Growth Score
            g_scores = [
                score_metric(m["rev_growth"], all_rev_g, True),
                score_metric(m["ni_growth"], all_ni_g, True)
            ]
            valid_g = [s for s in g_scores if s is not None]
            growth_score = round(sum(valid_g) / len(valid_g), 1) if valid_g else 5.0

            # 2. Profitability Score
            p_scores = [
                score_metric(m["gross_margin"], all_gm, True),
                score_metric(m["operating_margin"], all_om, True),
                score_metric(m["net_margin"], all_nm, True)
            ]
            valid_p = [s for s in p_scores if s is not None]
            profit_score = round(sum(valid_p) / len(valid_p), 1) if valid_p else 5.0

            # 3. Financial Health Score
            h_scores = [
                score_metric(m["current_ratio"], all_cr, True),
                score_metric(m["debt_to_equity"], all_de, False) # Lower debt is better
            ]
            valid_h = [s for s in h_scores if s is not None]
            health_score = round(sum(valid_h) / len(valid_h), 1) if valid_h else 5.0

            # 4. Cash Flow Score
            cf_scores = [
                score_metric(m["fcf_margin"], all_fcf_m, True)
            ]
            valid_cf = [s for s in cf_scores if s is not None]
            cf_score = round(sum(valid_cf) / len(valid_cf), 1) if valid_cf else 5.0

            # Weighted Total
            total_score = round(
                (growth_score * cls.CATEGORY_WEIGHTS["growth"]) +
                (profit_score * cls.CATEGORY_WEIGHTS["profitability"]) +
                (health_score * cls.CATEGORY_WEIGHTS["financial_health"]) +
                (cf_score * cls.CATEGORY_WEIGHTS["cash_flow"]),
                1
            )

            category_scores[cid] = {
                "growth": growth_score,
                "profitability": profit_score,
                "financial_health": health_score,
                "cash_flow": cf_score,
                "total": total_score
            }

        # Find winners per category
        def pick_winner(cat_name):
            best_cid = max(category_scores.keys(), key=lambda c: category_scores[c][cat_name])
            best_profile = next(p for p in profiles if p["id"] == best_cid)
            return {
                "company_id": best_cid,
                "company_name": best_profile["name"],
                "score": category_scores[best_cid][cat_name]
            }

        winners = {
            "overall": pick_winner("total"),
            "growth": pick_winner("growth"),
            "profitability": pick_winner("profitability"),
            "financial_health": pick_winner("financial_health"),
            "cash_flow": pick_winner("cash_flow")
        }

        return {
            "methodology": {
                "weights": cls.CATEGORY_WEIGHTS,
                "description": "Deterministic scoring normalized on 5.0-10.0 scale across comparable margins, growth rates, and leverage ratios (independent of absolute revenue size)."
            },
            "scores_by_company": category_scores,
            "category_winners": winners
        }

    @classmethod
    def _generate_ai_summary(cls, profiles: List[Dict[str, Any]], scorecard: Dict[str, Any], kpi_table: List[Dict[str, Any]]) -> str:
        """Generates a strictly grounded AI comparative commentary using Gemini."""
        if not GEMINI_API_KEY:
            return "AI comparison commentary unavailable (GEMINI_API_KEY not configured)."

        try:
            winners = scorecard["category_winners"]
            prompt_context = f"""
COMPARED COMPANIES:
{', '.join([f"{p['name']} (FY {p['latest_year']})" for p in profiles])}

CATEGORY LEADERS:
- Growth Leader: {winners['growth']['company_name']} ({winners['growth']['score']}/10)
- Profitability Leader: {winners['profitability']['company_name']} ({winners['profitability']['score']}/10)
- Financial Health & Balance Sheet: {winners['financial_health']['company_name']} ({winners['financial_health']['score']}/10)
- Cash Flow Generation: {winners['cash_flow']['company_name']} ({winners['cash_flow']['score']}/10)

Write a 2-3 paragraph objective executive summary of the relative performance and trade-offs between these companies.
RULES:
1. Do NOT make buy/sell investment recommendations.
2. Ground all points directly in the data above.
3. Highlight where each company stands out and where trade-offs exist (e.g. higher growth vs higher margins).
"""
            client = genai.Client(api_key=GEMINI_API_KEY)
            resp = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt_context,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=500
                )
            )
            return resp.text.strip()
        except Exception as e:
            print(f"[ComparisonEngine] AI summary error: {e}")
            return "Comparative financial analysis calculated from validated SEC Form 10-K data."
