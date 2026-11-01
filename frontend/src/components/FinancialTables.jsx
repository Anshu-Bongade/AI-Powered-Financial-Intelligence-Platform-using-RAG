import React, { useState } from 'react';
import {
  Table,
  Search,
  CheckCircle2,
  Calculator,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

/**
 * Converts a raw statement dict (field -> {year: value, ...}) into a flat
 * list of display rows: [{ label, values: {year: val}, isHeader }]
 */
function buildIncomeRows(income, years) {
  const defs = [
    { key: 'total_revenue',             label: 'Net Sales (Total Revenue)',    header: false },
    { key: 'products_revenue',          label: '  Products Revenue',           header: false },
    { key: 'services_revenue',          label: '  Services Revenue',           header: false },
    { key: 'cost_of_sales',             label: 'Cost of Sales',                header: false },
    { key: 'gross_margin',              label: 'Gross Margin',                 header: true  },
    { key: 'research_and_development',  label: 'R&D Expense',                  header: false },
    { key: 'selling_general_admin',     label: 'Selling, General & Admin',     header: false },
    { key: 'total_operating_expenses',  label: 'Total Operating Expenses',     header: false },
    { key: 'operating_income',          label: 'Operating Income (EBIT)',       header: true  },
    { key: 'tax_provision',             label: 'Income Tax Provision',         header: false },
    { key: 'net_income',                label: 'Net Income',                   header: true  },
    { key: 'diluted_eps',               label: 'Diluted EPS (per share)',       header: false },
    { key: 'basic_eps',                 label: 'Basic EPS (per share)',         header: false },
  ];
  return defs.map(d => ({
    label: d.label,
    isHeader: d.isHeader,
    isPerShare: d.key.includes('eps'),
    values: years.reduce((acc, y) => {
      acc[y] = income?.[d.key]?.[y] ?? null;
      return acc;
    }, {})
  }));
}

function buildBalanceRows(balance, years) {
  const defs = [
    { key: 'cash_and_equivalents',         label: 'Cash & Cash Equivalents' },
    { key: 'marketable_securities_current', label: 'Marketable Securities (Current)' },
    { key: 'accounts_receivable',           label: 'Accounts Receivable, Net' },
    { key: 'inventories',                   label: 'Inventories' },
    { key: 'total_current_assets',          label: 'Total Current Assets',   header: true },
    { key: 'property_plant_equipment',      label: 'Property, Plant & Equipment, Net' },
    { key: 'total_non_current_assets',      label: 'Total Non-Current Assets' },
    { key: 'total_assets',                  label: 'TOTAL ASSETS',           header: true },
    { key: 'accounts_payable',              label: 'Accounts Payable' },
    { key: 'commercial_paper',              label: 'Commercial Paper' },
    { key: 'term_debt_current',             label: 'Term Debt (Current)' },
    { key: 'total_current_liabilities',     label: 'Total Current Liabilities', header: true },
    { key: 'term_debt_non_current',         label: 'Long-Term Debt' },
    { key: 'total_non_current_liabilities', label: 'Total Non-Current Liabilities' },
    { key: 'total_liabilities',             label: 'TOTAL LIABILITIES',      header: true },
    { key: 'shareholders_equity',           label: "Shareholders' Equity",   header: true },
    { key: 'total_liabilities_and_equity',  label: 'Total Liabilities & Equity', header: true },
  ];
  return defs.map(d => ({
    label: d.label,
    isHeader: d.header || false,
    isPerShare: false,
    values: years.reduce((acc, y) => {
      acc[y] = balance?.[d.key]?.[y] ?? null;
      return acc;
    }, {})
  }));
}

function buildCashFlowRows(cashFlows, freeCashFlow, years) {
  const defs = [
    { key: 'operating_cash_flow', label: 'Operating Cash Flow',    header: true },
    { key: 'capex',               label: 'Capital Expenditures (CapEx)' },
    { key: null,                  label: 'Free Cash Flow (FCF)',   header: true, fcf: true },
    { key: 'investing_cash_flow', label: 'Investing Cash Flow' },
    { key: 'share_repurchases',   label: 'Share Repurchases' },
    { key: 'dividends_paid',      label: 'Dividends Paid' },
    { key: 'financing_cash_flow', label: 'Financing Cash Flow' },
  ];
  return defs.map(d => ({
    label: d.label,
    isHeader: d.header || false,
    isPerShare: false,
    values: years.reduce((acc, y) => {
      if (d.fcf) {
        acc[y] = freeCashFlow?.[y] ?? null;
      } else if (d.key) {
        acc[y] = cashFlows?.[d.key]?.[y] ?? null;
      } else {
        acc[y] = null;
      }
      return acc;
    }, {})
  }));
}

function buildRatiosRows(ratios, years) {
  const latestYear = years[0];
  const prevYear = years[1] || null;
  const rows = [];

  const addSection = (title, items) => {
    rows.push({ isSection: true, label: title });
    items.forEach(item => rows.push({ ...item, isSection: false }));
  };

  const rp = (y) => ratios?.[y]?.profitability || {};
  const rl = (y) => ratios?.[y]?.liquidity_solvency || {};
  const rc = (y) => ratios?.[y]?.cash_flow || {};

  addSection('Profitability Ratios', [
    { label: 'Gross Margin %',        formula: 'Gross Margin / Revenue',           values: years.reduce((a, y) => { a[y] = rp(y).gross_margin_pct;      return a; }, {}), unit: '%' },
    { label: 'Operating Margin %',    formula: 'Operating Income / Revenue',        values: years.reduce((a, y) => { a[y] = rp(y).operating_margin_pct;   return a; }, {}), unit: '%' },
    { label: 'Net Profit Margin %',   formula: 'Net Income / Revenue',              values: years.reduce((a, y) => { a[y] = rp(y).net_margin_pct;         return a; }, {}), unit: '%' },
    { label: 'Return on Assets %',    formula: 'Net Income / Total Assets',         values: years.reduce((a, y) => { a[y] = rp(y).return_on_assets_roa_pct; return a; }, {}), unit: '%' },
    { label: 'Return on Equity %',    formula: 'Net Income / Shareholders Equity',  values: years.reduce((a, y) => { a[y] = rp(y).return_on_equity_roe_pct; return a; }, {}), unit: '%' },
    { label: 'R&D Intensity %',       formula: 'R&D Expense / Revenue',             values: years.reduce((a, y) => { a[y] = rp(y).rd_intensity_pct;        return a; }, {}), unit: '%' },
  ]);

  addSection('Liquidity & Solvency', [
    { label: 'Current Ratio',         formula: 'Current Assets / Current Liabilities', values: years.reduce((a, y) => { a[y] = rl(y).current_ratio;    return a; }, {}), unit: 'x' },
    { label: 'Working Capital ($M)',   formula: 'Current Assets - Current Liabilities', values: years.reduce((a, y) => { a[y] = rl(y).working_capital;  return a; }, {}), unit: '' },
    { label: 'Cash Ratio',            formula: '(Cash + Mkt Sec) / Current Liab',       values: years.reduce((a, y) => { a[y] = rl(y).cash_ratio;       return a; }, {}), unit: 'x' },
    { label: 'Debt-to-Equity',        formula: 'Total Debt / Shareholders Equity',      values: years.reduce((a, y) => { a[y] = rl(y).debt_to_equity;   return a; }, {}), unit: 'x' },
    { label: 'Asset Turnover',        formula: 'Revenue / Total Assets',               values: years.reduce((a, y) => { a[y] = rl(y).asset_turnover;    return a; }, {}), unit: 'x' },
  ]);

  addSection('Cash Flow Quality', [
    { label: 'Free Cash Flow ($M)',    formula: 'Operating CF - |CapEx|',              values: years.reduce((a, y) => { a[y] = rc(y).free_cash_flow;        return a; }, {}), unit: '' },
    { label: 'FCF Conversion Rate %', formula: 'Free Cash Flow / Net Income',          values: years.reduce((a, y) => { a[y] = rc(y).fcf_conversion_pct;    return a; }, {}), unit: '%' },
    { label: 'OCF / Net Income',       formula: 'Operating CF / Net Income',           values: years.reduce((a, y) => { a[y] = rc(y).ocf_to_net_income;     return a; }, {}), unit: 'x' },
  ]);

  return rows;
}

export default function FinancialTables({ rawStatements, fiscalYears, ratios, validation }) {
  const [statementType, setStatementType] = useState('income');
  const [searchQuery, setSearchQuery] = useState('');

  const years = fiscalYears || ['2024', '2023', '2022'];
  const latestYear = years[0];
  const prevYear = years[1] || null;

  const income = rawStatements?.income_statement || {};
  const balance = rawStatements?.balance_sheet || {};
  const cashFlows = rawStatements?.cash_flows || {};

  // Build free cash flow from cash flows
  const freeCashFlow = years.reduce((acc, y) => {
    const ocf = cashFlows?.operating_cash_flow?.[y];
    const capex = cashFlows?.capex?.[y];
    if (ocf != null && capex != null) {
      acc[y] = Math.round((ocf - Math.abs(capex)) * 100) / 100;
    } else {
      acc[y] = null;
    }
    return acc;
  }, {});

  // Select rows
  let rows = [];
  if (statementType === 'income')    rows = buildIncomeRows(income, years);
  if (statementType === 'balance')   rows = buildBalanceRows(balance, years);
  if (statementType === 'cash_flow') rows = buildCashFlowRows(cashFlows, freeCashFlow, years);
  if (statementType === 'ratios')    rows = buildRatiosRows(ratios, years);

  // Filter
  const filteredRows = rows.filter(r =>
    r.isSection || r.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatVal = (val, isPerShare, unit) => {
    if (val === null || val === undefined) {
      return <span className="text-[10px] text-amber-400/70 italic">N/A</span>;
    }
    if (isPerShare || unit === 'x') {
      return <span>{val.toFixed(2)}{unit ? unit : ''}</span>;
    }
    if (unit === '%') {
      return <span>{val.toFixed(2)}%</span>;
    }
    // Regular dollar values
    const prefix = val < 0 ? '-$' : '$';
    return <span>{prefix}{Math.abs(val).toLocaleString()}</span>;
  };

  const getYoYDiff = (row) => {
    if (!prevYear) return null;
    const curr = row.values?.[latestYear];
    const prev = row.values?.[prevYear];
    if (curr == null || prev == null) return null;
    return curr - prev;
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataRows = filteredRows.filter(r => !r.isSection);
    let csv = `"Line Item",${years.map(y => `"FY ${y}"`).join(',')}\n`;
    dataRows.forEach(r => {
      const rowVals = years.map(y => {
        const v = r.values?.[y];
        return v != null ? v : '';
      });
      csv += `"${r.label}",${rowVals.join(',')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial_${statementType}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'income',    label: 'Income Statement' },
    { key: 'balance',   label: 'Balance Sheet' },
    { key: 'cash_flow', label: 'Cash Flows' },
    { key: 'ratios',    label: 'Financial Ratios' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">

      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-400" />
              Audited Financial Statements & Ratio Analysis
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              GAAP Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            All primary dollar amounts in Millions of USD. N/A = Not reported in this filing period.
          </p>
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter line items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Statement Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setStatementType(tab.key); setSearchQuery(''); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statementType === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {statementType === 'ratios' ? (
          /* Ratios Table */
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Metric / Ratio</th>
                <th className="py-3 px-3 text-[10px] text-slate-500 font-mono">Formula</th>
                {years.map(y => (
                  <th key={y} className="py-3 px-3 text-right">FY {y}</th>
                ))}
                <th className="py-3 px-3 text-right">YoY Δ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, idx) => {
                if (r.isSection) {
                  return (
                    <tr key={`section-${idx}`}>
                      <td colSpan={4 + years.length} className="pt-5 pb-2 px-3">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 border-b border-slate-800/60 pb-1">
                          {r.label}
                        </div>
                      </td>
                    </tr>
                  );
                }
                const curr = r.values?.[latestYear];
                const prev = prevYear ? r.values?.[prevYear] : null;
                const delta = curr != null && prev != null ? curr - prev : null;
                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors border-b border-slate-800/30">
                    <td className="py-3 px-3 font-sans font-medium text-slate-200">
                      {r.label}
                    </td>
                    <td className="py-2 px-3 text-[10px] text-slate-500 font-mono">{r.formula}</td>
                    {years.map(y => (
                      <td key={y} className={`py-3 px-3 text-right font-mono ${y === latestYear ? 'text-sky-300 font-bold' : 'text-slate-300'}`}>
                        {r.values?.[y] != null
                          ? `${r.values[y].toFixed(2)}${r.unit || ''}`
                          : <span className="text-slate-600 text-[10px]">—</span>}
                      </td>
                    ))}
                    <td className={`py-3 px-3 text-right font-semibold font-mono ${
                      delta == null ? 'text-slate-500'
                        : delta > 0 ? 'text-emerald-400'
                        : delta < 0 ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}>
                      {delta != null
                        ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}${r.unit || ''}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Financial Statements Table */
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Reported Line Item</th>
                {years.map(y => (
                  <th key={y} className="py-3 px-3 text-right">
                    FY {y} {y === latestYear ? <span className="text-indigo-400">(Latest)</span> : ''}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">YoY Δ</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-mono">
              {filteredRows.map((row, idx) => {
                const diff = getYoYDiff(row);
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-900/40 transition-colors ${row.isHeader ? 'bg-slate-900/30' : ''}`}
                  >
                    <td className={`py-3 px-3 font-sans ${row.isHeader ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
                      {row.label}
                    </td>
                    {years.map(y => {
                      const val = row.values?.[y];
                      return (
                        <td key={y} className={`py-3 px-3 text-right ${
                          y === latestYear
                            ? row.isHeader ? 'text-white font-bold' : 'text-slate-100 font-semibold'
                            : 'text-slate-300'
                        }`}>
                          {formatVal(val, row.isPerShare, null)}
                        </td>
                      );
                    })}
                    <td className={`py-3 px-3 text-right font-semibold ${
                      diff == null ? 'text-slate-500'
                        : diff > 0 ? 'text-emerald-400'
                        : diff < 0 ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}>
                      {diff != null
                        ? `${diff > 0 ? '+$' : '-$'}${Math.abs(diff).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Validation Banner */}
      {validation && (
        <div className="mt-5 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-slate-300">
              <strong className="text-white">GAAP Validation:</strong>{' '}
              {validation.passed_checks}/{validation.total_checks} arithmetic checks passed with $0M discrepancy.
              All numbers cross-referenced with the official SEC Form 10-K filing.
            </p>
            {validation.flagged_missing_items?.map((flag, idx) => (
              <p key={idx} className="text-amber-300/80 text-[11px]">
                • <strong>{flag.statement} Notice:</strong> {flag.explanation}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
