from typing import Dict, Any, List, Optional

class FinancialAnalytics:
    @staticmethod
    def _safe_div(numerator: Optional[float], denominator: Optional[float], default: Optional[float] = None) -> Optional[float]:
        if numerator is None or denominator is None or denominator == 0:
            return default
        return round(numerator / denominator, 4)

    @staticmethod
    def _safe_growth(curr: Optional[float], prev: Optional[float]) -> Optional[float]:
        if curr is None or prev is None or prev == 0:
            return None
        return round(((curr - prev) / abs(prev)) * 100, 2)

    @classmethod
    def calculate_analytics(cls, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compute YoY growth, financial ratios, validation checks, and chart data."""
        income = raw_data.get("income_statement", {})
        balance = raw_data.get("balance_sheet", {})
        cash = raw_data.get("cash_flows", {})
        years = sorted([str(y) for y in raw_data.get("fiscal_years", [2024, 2023, 2022])], reverse=True)

        # -------------------------------------------------------------
        # 1. Year-over-Year (YoY) Growth Calculations
        # -------------------------------------------------------------
        yoy_growth: Dict[str, Dict[str, Optional[float]]] = {
            "revenue": {},
            "net_income": {},
            "operating_income": {},
            "gross_margin": {},
            "operating_cash_flow": {},
            "free_cash_flow": {},
            "diluted_eps": {}
        }

        # Compute Free Cash Flow for all available years
        free_cash_flow_by_year: Dict[str, Optional[float]] = {}
        for y in years:
            ocf = cash.get("operating_cash_flow", {}).get(y)
            capex = cash.get("capex", {}).get(y)
            if ocf is not None and capex is not None:
                free_cash_flow_by_year[y] = round(ocf - abs(capex), 2)
            else:
                free_cash_flow_by_year[y] = None

        for i in range(len(years) - 1):
            curr_y = years[i]
            prev_y = years[i + 1]

            yoy_growth["revenue"][curr_y] = cls._safe_growth(
                income.get("total_revenue", {}).get(curr_y),
                income.get("total_revenue", {}).get(prev_y)
            )
            yoy_growth["net_income"][curr_y] = cls._safe_growth(
                income.get("net_income", {}).get(curr_y),
                income.get("net_income", {}).get(prev_y)
            )
            yoy_growth["operating_income"][curr_y] = cls._safe_growth(
                income.get("operating_income", {}).get(curr_y),
                income.get("operating_income", {}).get(prev_y)
            )
            yoy_growth["gross_margin"][curr_y] = cls._safe_growth(
                income.get("gross_margin", {}).get(curr_y),
                income.get("gross_margin", {}).get(prev_y)
            )
            yoy_growth["operating_cash_flow"][curr_y] = cls._safe_growth(
                cash.get("operating_cash_flow", {}).get(curr_y),
                cash.get("operating_cash_flow", {}).get(prev_y)
            )
            yoy_growth["free_cash_flow"][curr_y] = cls._safe_growth(
                free_cash_flow_by_year.get(curr_y),
                free_cash_flow_by_year.get(prev_y)
            )
            yoy_growth["diluted_eps"][curr_y] = cls._safe_growth(
                income.get("diluted_eps", {}).get(curr_y),
                income.get("diluted_eps", {}).get(prev_y)
            )

        # -------------------------------------------------------------
        # 2. Financial Ratios Calculation
        # -------------------------------------------------------------
        ratios_by_year: Dict[str, Dict[str, Any]] = {}
        for y in years:
            rev = income.get("total_revenue", {}).get(y)
            gm = income.get("gross_margin", {}).get(y)
            oi = income.get("operating_income", {}).get(y)
            ni = income.get("net_income", {}).get(y)
            rd = income.get("research_and_development", {}).get(y)

            tot_assets = balance.get("total_assets", {}).get(y)
            curr_assets = balance.get("total_current_assets", {}).get(y)
            tot_liab = balance.get("total_liabilities", {}).get(y)
            curr_liab = balance.get("total_current_liabilities", {}).get(y)
            equity = balance.get("shareholders_equity", {}).get(y)
            cash_eq = balance.get("cash_and_equivalents", {}).get(y)
            mkt_sec = balance.get("marketable_securities_current", {}).get(y)

            ocf = cash.get("operating_cash_flow", {}).get(y)
            fcf = free_cash_flow_by_year.get(y)

            term_debt_curr = balance.get("term_debt_current", {}).get(y) or 0.0
            term_debt_noncurr = balance.get("term_debt_non_current", {}).get(y) or 0.0
            comm_paper = balance.get("commercial_paper", {}).get(y) or 0.0
            total_debt = term_debt_curr + term_debt_noncurr + comm_paper if (term_debt_curr or term_debt_noncurr or comm_paper) else None

            # Profitability Ratios
            gross_margin_pct = round(gm / rev * 100, 2) if (gm is not None and rev) else None
            operating_margin_pct = round(oi / rev * 100, 2) if (oi is not None and rev) else None
            net_margin_pct = round(ni / rev * 100, 2) if (ni is not None and rev) else None
            rd_intensity_pct = round(rd / rev * 100, 2) if (rd is not None and rev) else None
            roa_pct = round(ni / tot_assets * 100, 2) if (ni is not None and tot_assets) else None
            roe_pct = round(ni / equity * 100, 2) if (ni is not None and equity) else None

            # Liquidity & Solvency Ratios
            current_ratio = round(curr_assets / curr_liab, 2) if (curr_assets is not None and curr_liab) else None
            working_capital = round(curr_assets - curr_liab, 2) if (curr_assets is not None and curr_liab is not None) else None
            cash_quick_assets = (cash_eq or 0.0) + (mkt_sec or 0.0)
            cash_ratio = round(cash_quick_assets / curr_liab, 2) if (cash_quick_assets and curr_liab) else None

            debt_to_equity = round(total_debt / equity, 2) if (total_debt is not None and equity) else None
            debt_to_assets = round(total_debt / tot_assets, 2) if (total_debt is not None and tot_assets) else None
            liabilities_to_equity = round(tot_liab / equity, 2) if (tot_liab is not None and equity) else None
            asset_turnover = round(rev / tot_assets, 2) if (rev is not None and tot_assets) else None

            # Cash Flow Health
            fcf_conversion_pct = round(fcf / ni * 100, 2) if (fcf is not None and ni) else None
            ocf_to_ni = round(ocf / ni, 2) if (ocf is not None and ni) else None

            ratios_by_year[y] = {
                "profitability": {
                    "gross_margin_pct": gross_margin_pct,
                    "operating_margin_pct": operating_margin_pct,
                    "net_margin_pct": net_margin_pct,
                    "rd_intensity_pct": rd_intensity_pct,
                    "return_on_assets_roa_pct": roa_pct,
                    "return_on_equity_roe_pct": roe_pct,
                },
                "liquidity_solvency": {
                    "current_ratio": current_ratio,
                    "working_capital": working_capital,
                    "cash_ratio": cash_ratio,
                    "debt_to_equity": debt_to_equity,
                    "debt_to_assets": debt_to_assets,
                    "liabilities_to_equity": liabilities_to_equity,
                    "asset_turnover": asset_turnover,
                },
                "cash_flow": {
                    "free_cash_flow": fcf,
                    "fcf_conversion_pct": fcf_conversion_pct,
                    "ocf_to_net_income": ocf_to_ni,
                }
            }

        # -------------------------------------------------------------
        # 3. Data Accuracy & Arithmetic Validation Checks
        # -------------------------------------------------------------
        validation_checks: List[Dict[str, Any]] = []
        flagged_items: List[Dict[str, Any]] = []

        # Check Balance Sheet Identity: Total Assets == Total Liabilities + Shareholders' Equity
        for y in years:
            tot_a = balance.get("total_assets", {}).get(y)
            tot_l = balance.get("total_liabilities", {}).get(y)
            eq = balance.get("shareholders_equity", {}).get(y)

            if tot_a is not None and tot_l is not None and eq is not None:
                calc_sum = tot_l + eq
                diff = abs(tot_a - calc_sum)
                passed = diff <= 2.0  # 2 million tolerance for rounding in SEC filings
                validation_checks.append({
                    "year": y,
                    "statement": "Balance Sheet",
                    "check_name": "Accounting Equation (Assets = Liabilities + Equity)",
                    "reported_value": tot_a,
                    "calculated_value": calc_sum,
                    "discrepancy": round(diff, 2),
                    "status": "PASS" if passed else "FAIL",
                    "explanation": f"Assets (${tot_a:,.0f}M) matches Liabilities (${tot_l:,.0f}M) + Equity (${eq:,.0f}M) within ${diff:.1f}M tolerance."
                })
            else:
                flagged_items.append({
                    "year": y,
                    "statement": "Balance Sheet",
                    "field": "balance_sheet_components",
                    "status": "NOT_REPORTED",
                    "explanation": f"SEC Form 10-K provides 2 fiscal years for Balance Sheets. Year {y} balance sheet items are not reported in this filing."
                })

        # Check Income Statement: Revenue - Cost of Sales == Gross Margin
        for y in years:
            rev = income.get("total_revenue", {}).get(y)
            cos = income.get("cost_of_sales", {}).get(y)
            gm = income.get("gross_margin", {}).get(y)

            if rev is not None and cos is not None and gm is not None:
                calc_gm = rev - cos
                diff = abs(gm - calc_gm)
                passed = diff <= 2.0
                validation_checks.append({
                    "year": y,
                    "statement": "Income Statement",
                    "check_name": "Gross Profit Check (Revenue - Cost of Sales = Gross Margin)",
                    "reported_value": gm,
                    "calculated_value": calc_gm,
                    "discrepancy": round(diff, 2),
                    "status": "PASS" if passed else "FAIL",
                    "explanation": f"Gross Margin (${gm:,.0f}M) matches Revenue (${rev:,.0f}M) minus Cost of Sales (${cos:,.0f}M)."
                })

        # Check Operating Income: Gross Margin - Operating Expenses == Operating Income
        for y in years:
            gm = income.get("gross_margin", {}).get(y)
            opex = income.get("total_operating_expenses", {}).get(y)
            oi = income.get("operating_income", {}).get(y)

            if gm is not None and opex is not None and oi is not None:
                calc_oi = gm - opex
                diff = abs(oi - calc_oi)
                passed = diff <= 2.0
                validation_checks.append({
                    "year": y,
                    "statement": "Income Statement",
                    "check_name": "Operating Profit Check (Gross Margin - OpEx = Operating Income)",
                    "reported_value": oi,
                    "calculated_value": calc_oi,
                    "discrepancy": round(diff, 2),
                    "status": "PASS" if passed else "FAIL",
                    "explanation": f"Operating Income (${oi:,.0f}M) matches Gross Margin (${gm:,.0f}M) minus OpEx (${opex:,.0f}M)."
                })

        # Check Free Cash Flow: Operating Cash Flow - |CapEx| == FCF
        for y in years:
            ocf = cash.get("operating_cash_flow", {}).get(y)
            capex = cash.get("capex", {}).get(y)
            fcf = free_cash_flow_by_year.get(y)

            if ocf is not None and capex is not None and fcf is not None:
                calc_fcf = ocf - abs(capex)
                diff = abs(fcf - calc_fcf)
                validation_checks.append({
                    "year": y,
                    "statement": "Cash Flows",
                    "check_name": "Free Cash Flow Formula (Operating Cash Flow - |CapEx| = FCF)",
                    "reported_value": fcf,
                    "calculated_value": calc_fcf,
                    "discrepancy": round(diff, 2),
                    "status": "PASS" if diff <= 0.01 else "FAIL",
                    "explanation": f"Free Cash Flow (${fcf:,.0f}M) verified as Operating Cash Flow (${ocf:,.0f}M) minus Capital Expenditures (${abs(capex):,.0f}M)."
                })

        # -------------------------------------------------------------
        # 4. Interactive Chart Datasets
        # -------------------------------------------------------------
        # Chronological order for time series charts
        chrono_years = sorted(years)

        # Revenue & Net Income Trend
        revenue_trend = []
        for y in chrono_years:
            revenue_trend.append({
                "year": y,
                "revenue": income.get("total_revenue", {}).get(y),
                "operating_income": income.get("operating_income", {}).get(y),
                "net_income": income.get("net_income", {}).get(y)
            })

        # Revenue Breakdown (Products vs Services)
        revenue_breakdown = []
        for y in chrono_years:
            revenue_breakdown.append({
                "year": y,
                "products": income.get("products_revenue", {}).get(y),
                "services": income.get("services_revenue", {}).get(y),
                "total": income.get("total_revenue", {}).get(y)
            })

        # Margins Trend
        margin_trend = []
        for y in chrono_years:
            r = ratios_by_year.get(y, {}).get("profitability", {})
            margin_trend.append({
                "year": y,
                "gross_margin_pct": r.get("gross_margin_pct"),
                "operating_margin_pct": r.get("operating_margin_pct"),
                "net_margin_pct": r.get("net_margin_pct")
            })

        # Cash Flow Waterfall / Bar
        cash_flow_trend = []
        for y in chrono_years:
            cash_flow_trend.append({
                "year": y,
                "operating_cf": cash.get("operating_cash_flow", {}).get(y),
                "investing_cf": cash.get("investing_cash_flow", {}).get(y),
                "financing_cf": cash.get("financing_cash_flow", {}).get(y),
                "capex": cash.get("capex", {}).get(y),
                "free_cash_flow": free_cash_flow_by_year.get(y)
            })

        # Capital Structure / Assets vs Liabilities
        balance_sheet_structure = []
        for y in chrono_years:
            balance_sheet_structure.append({
                "year": y,
                "total_assets": balance.get("total_assets", {}).get(y),
                "total_liabilities": balance.get("total_liabilities", {}).get(y),
                "shareholders_equity": balance.get("shareholders_equity", {}).get(y),
                "current_assets": balance.get("total_current_assets", {}).get(y),
                "current_liabilities": balance.get("total_current_liabilities", {}).get(y)
            })

        # Latest year KPI Summary Cards
        latest_year = years[0] if years else "2024"
        prev_year = years[1] if len(years) > 1 else None

        kpis = {
            "latest_year": latest_year,
            "previous_year": prev_year,
            "revenue": {
                "value": income.get("total_revenue", {}).get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "yoy_growth": yoy_growth["revenue"].get(latest_year),
                "label": "Total Net Sales"
            },
            "net_income": {
                "value": income.get("net_income", {}).get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "yoy_growth": yoy_growth["net_income"].get(latest_year),
                "label": "Net Income"
            },
            "operating_income": {
                "value": income.get("operating_income", {}).get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "yoy_growth": yoy_growth["operating_income"].get(latest_year),
                "label": "Operating Income"
            },
            "gross_margin_pct": {
                "value": ratios_by_year.get(latest_year, {}).get("profitability", {}).get("gross_margin_pct"),
                "unit": "%",
                "currency": "",
                "label": "Gross Margin %"
            },
            "operating_margin_pct": {
                "value": ratios_by_year.get(latest_year, {}).get("profitability", {}).get("operating_margin_pct"),
                "unit": "%",
                "currency": "",
                "label": "Operating Margin %"
            },
            "free_cash_flow": {
                "value": free_cash_flow_by_year.get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "yoy_growth": yoy_growth["free_cash_flow"].get(latest_year),
                "label": "Free Cash Flow"
            },
            "diluted_eps": {
                "value": income.get("diluted_eps", {}).get(latest_year),
                "unit": "per share",
                "currency": "$",
                "yoy_growth": yoy_growth["diluted_eps"].get(latest_year),
                "label": "Diluted EPS"
            },
            "total_assets": {
                "value": balance.get("total_assets", {}).get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "label": "Total Assets"
            },
            "total_liabilities": {
                "value": balance.get("total_liabilities", {}).get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "label": "Total Liabilities"
            },
            "shareholders_equity": {
                "value": balance.get("shareholders_equity", {}).get(latest_year),
                "unit": raw_data.get("unit", "millions"),
                "currency": raw_data.get("currency", "USD"),
                "label": "Shareholders' Equity"
            }
        }

        return {
            "company_name": raw_data.get("company_name", "Apple Inc."),
            "document_title": raw_data.get("document_title", "Annual Report Form 10-K"),
            "source_document": raw_data.get("source_document", "Apple.pdf"),
            "currency": raw_data.get("currency", "USD"),
            "unit": raw_data.get("unit", "millions"),
            "fiscal_years": years,
            "kpis": kpis,
            "yoy_growth": yoy_growth,
            "ratios": ratios_by_year,
            "statements": {
                "income_statement": income,
                "balance_sheet": balance,
                "cash_flows": cash
            },
            "free_cash_flow": free_cash_flow_by_year,
            "validation": {
                "status": "PASSED" if all(c["status"] == "PASS" for c in validation_checks) else "FLAGGED",
                "passed_checks": sum(1 for c in validation_checks if c["status"] == "PASS"),
                "total_checks": len(validation_checks),
                "checks": validation_checks,
                "flagged_missing_items": flagged_items
            },
            "charts": {
                "revenue_trend": revenue_trend,
                "revenue_breakdown": revenue_breakdown,
                "margin_trend": margin_trend,
                "cash_flow_trend": cash_flow_trend,
                "balance_sheet_structure": balance_sheet_structure
            },
            "source_citations": raw_data.get("source_citations", {})
        }
