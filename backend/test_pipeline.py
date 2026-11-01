import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
from backend.financial_extractor import FinancialExtractor
from backend.financial_analytics import FinancialAnalytics

extractor = FinancialExtractor()
raw_data = extractor.extract_from_markdown(Path("mark_down/Apple.md"), "Apple.pdf", force_refresh=True)
analytics = FinancialAnalytics.calculate_analytics(raw_data)

print("SUCCESS! Extracted and Analyzed.")
print("Company:", analytics["company_name"])
print("Currency & Unit:", analytics["currency"], analytics["unit"])
print("KPIs:", json.dumps(analytics["kpis"], indent=2))

print("\nValidation Checks:")
for c in analytics["validation"]["checks"]:
    print(f"[{c['status']}] {c['check_name']} ({c['year']}) - reported: {c['reported_value']} | calc: {c['calculated_value']} | disc: {c['discrepancy']}")

print("\nFlagged Items (Missing in filing):")
for f in analytics["validation"]["flagged_missing_items"]:
    print(f"[{f['status']}] {f['field']} ({f['year']}) - {f['explanation']}")

print("\nValidation overall status:", analytics["validation"]["status"])
print(f"Passed: {analytics['validation']['passed_checks']}/{analytics['validation']['total_checks']}")
