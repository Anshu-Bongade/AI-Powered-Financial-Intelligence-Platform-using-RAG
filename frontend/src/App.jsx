import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import ChartsSection from './components/ChartsSection';
import FinancialRatios from './components/FinancialRatios';
import ValidationAudit from './components/ValidationAudit';
import ChatInterface from './components/ChatInterface';
import UploadModal from './components/UploadModal';
import FinancialTables from './components/FinancialTables';
import CompanyComparison from './components/CompanyComparison';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Coins,
  RefreshCw,
  BarChart2,
} from 'lucide-react';
import './App.css';

/**
 * Transforms the raw API response from /api/financials into
 * component-ready data structures.
 */
function transformApiData(data) {
  if (!data) return null;

  const { kpis, ratios, charts, validation, statements, yoy_growth, free_cash_flow } = data;
  const years = data.fiscal_years || ['2024', '2023', '2022'];
  const latestYear = years[0];
  const prevYear = years[1] || null;

  // ─── KPI Cards Array ────────────────────────────────────────────────────────
  const kpiCards = [
    {
      id: 'revenue',
      title: 'Total Net Sales',
      formatted_value: kpis?.revenue?.value ? `$${(kpis.revenue.value / 1000).toFixed(2)}B` : '—',
      yoy_text: kpis?.revenue?.yoy_growth != null ? `${kpis.revenue.yoy_growth > 0 ? '+' : ''}${kpis.revenue.yoy_growth}%` : null,
      yoy_change: kpis?.revenue?.yoy_growth,
      period: `FY ${latestYear}`,
      unit: 'USD Millions',
      confidence: 'audited',
      citation: 'Consolidated Statements of Operations',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: statements?.income_statement?.total_revenue?.[y] ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'net_income',
      title: 'Net Income',
      formatted_value: kpis?.net_income?.value ? `$${(kpis.net_income.value / 1000).toFixed(2)}B` : '—',
      yoy_text: kpis?.net_income?.yoy_growth != null ? `${kpis.net_income.yoy_growth > 0 ? '+' : ''}${kpis.net_income.yoy_growth}%` : null,
      yoy_change: kpis?.net_income?.yoy_growth,
      period: `FY ${latestYear}`,
      unit: 'USD Millions',
      confidence: 'audited',
      citation: 'Consolidated Statements of Operations',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: statements?.income_statement?.net_income?.[y] ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'operating_income',
      title: 'Operating Income',
      formatted_value: kpis?.operating_income?.value ? `$${(kpis.operating_income.value / 1000).toFixed(2)}B` : '—',
      yoy_text: kpis?.operating_income?.yoy_growth != null ? `${kpis.operating_income.yoy_growth > 0 ? '+' : ''}${kpis.operating_income.yoy_growth}%` : null,
      yoy_change: kpis?.operating_income?.yoy_growth,
      period: `FY ${latestYear}`,
      unit: 'USD Millions',
      confidence: 'audited',
      citation: 'Consolidated Statements of Operations',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: statements?.income_statement?.operating_income?.[y] ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'gross_margin_pct',
      title: 'Gross Margin %',
      formatted_value: kpis?.gross_margin_pct?.value != null ? `${kpis.gross_margin_pct.value}%` : '—',
      yoy_text: null,
      yoy_change: null,
      period: `FY ${latestYear}`,
      unit: '%',
      confidence: 'calculated',
      citation: 'Gross Margin / Total Net Sales',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: ratios?.[y]?.profitability?.gross_margin_pct ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'free_cash_flow',
      title: 'Free Cash Flow',
      formatted_value: kpis?.free_cash_flow?.value != null ? `$${(kpis.free_cash_flow.value / 1000).toFixed(2)}B` : '—',
      yoy_text: kpis?.free_cash_flow?.yoy_growth != null ? `${kpis.free_cash_flow.yoy_growth > 0 ? '+' : ''}${kpis.free_cash_flow.yoy_growth}%` : null,
      yoy_change: kpis?.free_cash_flow?.yoy_growth,
      period: `FY ${latestYear}`,
      unit: 'USD Millions',
      confidence: 'calculated',
      citation: 'Operating Cash Flow minus Capital Expenditures',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: free_cash_flow?.[y] ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'diluted_eps',
      title: 'Diluted EPS',
      formatted_value: kpis?.diluted_eps?.value != null ? `$${kpis.diluted_eps.value.toFixed(2)}` : '—',
      yoy_text: kpis?.diluted_eps?.yoy_growth != null ? `${kpis.diluted_eps.yoy_growth > 0 ? '+' : ''}${kpis.diluted_eps.yoy_growth}%` : null,
      yoy_change: kpis?.diluted_eps?.yoy_growth,
      period: `FY ${latestYear}`,
      unit: 'per share',
      confidence: 'audited',
      citation: 'Consolidated Statements of Operations — Per diluted share',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: statements?.income_statement?.diluted_eps?.[y] ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'total_assets',
      title: 'Total Assets',
      formatted_value: kpis?.total_assets?.value != null ? `$${(kpis.total_assets.value / 1000).toFixed(2)}B` : '—',
      yoy_text: null,
      yoy_change: null,
      period: `FY ${latestYear}`,
      unit: 'USD Millions',
      confidence: 'audited',
      citation: 'Consolidated Balance Sheets',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: statements?.balance_sheet?.total_assets?.[y] ?? null
      })).reverse().slice(0, 3)
    },
    {
      id: 'operating_margin',
      title: 'Operating Margin %',
      formatted_value: kpis?.operating_margin_pct?.value != null ? `${kpis.operating_margin_pct.value}%` : '—',
      yoy_text: null,
      yoy_change: null,
      period: `FY ${latestYear}`,
      unit: '%',
      confidence: 'calculated',
      citation: 'Operating Income / Total Net Sales',
      source_doc: data.source_document,
      impact_note: null,
      history: years.map(y => ({
        year: String(y),
        value: ratios?.[y]?.profitability?.operating_margin_pct ?? null
      })).reverse().slice(0, 3)
    },
  ];

  // ─── Chart Trends (chronological for line/bar charts) ───────────────────────
  const chartTrends = (charts?.revenue_trend || []).map((item) => {
    const y = item.year;
    const rp = ratios?.[y]?.profitability || {};
    const cfItem = charts?.cash_flow_trend?.find(c => c.year === y) || {};
    const bsItem = charts?.balance_sheet_structure?.find(b => b.year === y) || {};
    return {
      year: y,
      revenue: statements?.income_statement?.total_revenue?.[y] ?? item.revenue,
      gross_margin: statements?.income_statement?.gross_margin?.[y] ?? null,
      operating_income: statements?.income_statement?.operating_income?.[y] ?? item.operating_income,
      net_income: statements?.income_statement?.net_income?.[y] ?? item.net_income,
      gross_margin_pct: rp.gross_margin_pct ?? null,
      operating_margin_pct: rp.operating_margin_pct ?? null,
      net_margin_pct: rp.net_margin_pct ?? null,
      operating_cash_flow: cfItem.operating_cf ?? null,
      capex: cfItem.capex != null ? Math.abs(cfItem.capex) : null,
      free_cash_flow: cfItem.free_cash_flow ?? free_cash_flow?.[y] ?? null,
      total_assets: bsItem.total_assets ?? null,
      total_liabilities: bsItem.total_liabilities ?? null,
      equity: bsItem.shareholders_equity ?? null,
    };
  });

  // ─── Product Categories for segment bar chart ───────────────────────────────
  const productCategories = (charts?.revenue_breakdown || []).map(item => ({
    name: item.year,
    ...item
  }));

  // Product segment horizontal bar (name=segment, 2024/2023/2022=values)
  const segmentNames = [
    { key: 'products', label: 'Products' },
    { key: 'services', label: 'Services' }
  ];
  const productMixData = segmentNames.map(seg => {
    const row = { name: seg.label };
    years.forEach(y => {
      row[y] = statements?.income_statement?.[`${seg.key}_revenue`]?.[y] ?? null;
    });
    return row;
  });

  // ─── Metadata ────────────────────────────────────────────────────────────────
  const metadata = {
    company_name: data.company_name,
    ticker: data.ticker || '',
    fiscal_period: `FY ${latestYear}`,
    filing_type: 'Form 10-K',
    unit: data.unit || 'millions',
    currency: data.currency || 'USD',
  };

  // ─── KpiCards data structure (for KpiCards.jsx) ─────────────────────────────
  const kpiCardsData = {
    company_name: data.company_name,
    document_title: data.document_title,
    source_document: data.source_document,
    fiscal_years: years,
    currency: data.currency,
    unit: data.unit,
    kpis: {
      ...kpis,
      latest_year: latestYear,
    },
    validation,
  };

  // ─── FinancialRatios data ─────────────────────────────────────────────────────
  const ratiosData = {
    ratios,
    fiscal_years: years,
  };

  // ─── ValidationAudit data ────────────────────────────────────────────────────
  const validationData = {
    company_name: data.company_name,
    source_document: data.source_document,
    validation,
    source_citations: data.source_citations || {},
  };

  // ─── Analytics object for ChartsSection ──────────────────────────────────────
  const analytics = {
    ratios,
    latest_year: latestYear,
  };

  return {
    raw: data,
    metadata,
    kpiCards,
    kpiCardsData,
    chartTrends,
    productMixData,
    productCategories,
    ratiosData,
    validationData,
    analytics,
    statements: data.statements,
    validation,
    free_cash_flow,
  };
}

export default function App() {
  const [rawData, setRawData] = useState(null);
  const [appData, setAppData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [currentDoc, setCurrentDoc] = useState('Apple.pdf');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setAvailableDocs(data.documents || []);
      }
    } catch (e) {
      console.error('Failed to fetch documents:', e);
    }
  };

  const fetchData = async (docName = null) => {
    setIsLoading(true);
    setError(null);
    const targetDoc = docName || currentDoc || 'Apple.pdf';
    try {
      const financialsUrl = `/api/financials?doc_name=${encodeURIComponent(targetDoc)}`;

      const [finRes, healthRes] = await Promise.all([
        fetch(financialsUrl),
        fetch('/api/health')
      ]);

      if (!finRes.ok) throw new Error(`Financials API failed: ${finRes.statusText}`);
      const finData = await finRes.json();
      setRawData(finData);
      setAppData(transformApiData(finData));
      if (finData.source_document) {
        setCurrentDoc(finData.source_document);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemStatus(healthData);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Called when an upload completes — load the newly-uploaded document
  // directly from the upload response (no extra API round-trip needed)
  const handleUploadSuccess = (uploadResponse) => {
    setIsUploadOpen(false);
    fetchDocuments(); // Refresh document list
    if (uploadResponse?.report) {
      // The upload API already ran Gemini extraction; use it immediately
      const finData = uploadResponse.report;
      setRawData(finData);
      setAppData(transformApiData(finData));
      if (finData.source_document) {
        setCurrentDoc(finData.source_document);
      }
      // Refresh health/system status in background
      fetch('/api/health').then(r => r.json()).then(setSystemStatus).catch(() => {});
    } else if (uploadResponse?.filename) {
      setCurrentDoc(uploadResponse.filename);
      fetchData(uploadResponse.filename);
    } else {
      fetchData();
    }
  };

  const handleDeleteDoc = async (filename) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete failed');
      }

      // Refresh list of documents
      const docsRes = await fetch('/api/documents');
      const docsData = await docsRes.json();
      const updatedDocs = docsData.documents || [];
      setAvailableDocs(updatedDocs);

      // If the currently selected doc was deleted, switch to the first remaining doc
      const nextDoc = updatedDocs.find(d => d.filename !== filename)?.filename || 'Apple.pdf';
      setCurrentDoc(nextDoc);
      await fetchData(nextDoc);
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Could not delete report: ${err.message}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchData();
  }, []);

  const { metadata, kpiCards, kpiCardsData, chartTrends, productMixData, ratiosData, validationData, analytics, statements, validation } = appData || {};

  // Highlight pills from parsed data
  const highlightRevenue = rawData?.kpis?.revenue?.value;
  const highlightFCF = rawData?.free_cash_flow?.[rawData?.fiscal_years?.[0]];
  const highlightGrossMargin = rawData?.ratios?.[rawData?.fiscal_years?.[0]]?.profitability?.gross_margin_pct;
  const highlightRevenueGrowth = rawData?.yoy_growth?.revenue?.[rawData?.fiscal_years?.[0]];
  const highlightFCFGrowth = rawData?.yoy_growth?.free_cash_flow?.[rawData?.fiscal_years?.[0]];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* Top Header */}
      <Header
        metadata={metadata}
        systemStatus={systemStatus}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        chromaChunks={systemStatus?.chroma_chunks_count}
        documents={availableDocs}
        selectedDoc={currentDoc}
        onSelectDoc={(doc) => {
          if (doc && doc !== 'all') {
            setCurrentDoc(doc);
            fetchData(doc);
          }
        }}
        onDeleteDoc={handleDeleteDoc}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── TAB: Multi-Company Comparison ── */}
        {activeTab === 'compare' ? (
          <CompanyComparison />
        ) : (
          <>
            {/* Loading Spinner */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-spin">
                  <RefreshCw className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm text-slate-400 font-mono">
                  Extracting audited SEC 10-K statements & calculating ratios...
                </p>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-500 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {appData && !isLoading && (
              <>
                {/* Company Overview Strip */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {metadata?.company_name}
                    {metadata?.ticker && (
                      <span className="ml-2 text-base text-sky-400 font-mono">({metadata.ticker})</span>
                    )}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    {metadata?.fiscal_period} Audited
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                  <span>Filing: {metadata?.filing_type}</span>
                  <span>•</span>
                  <span>Reporting Unit: {metadata?.unit} of {metadata?.currency}</span>
                  {validation && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">
                        ✓ {validation.passed_checks}/{validation.total_checks} GAAP Checks Passed
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Quick Highlight Pills */}
              <div className="flex flex-wrap items-center gap-2.5">
                {highlightRevenue != null && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400">Net Sales: </span>
                    <strong className="text-white font-mono">${(highlightRevenue / 1000).toFixed(2)}B</strong>
                    {highlightRevenueGrowth != null && (
                      <span className={`text-[11px] ml-1 font-semibold ${highlightRevenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({highlightRevenueGrowth > 0 ? '+' : ''}{highlightRevenueGrowth}%)
                      </span>
                    )}
                  </div>
                )}

                {highlightFCF != null && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400">Free Cash Flow: </span>
                    <strong className="text-sky-400 font-mono">${(highlightFCF / 1000).toFixed(2)}B</strong>
                    {highlightFCFGrowth != null && (
                      <span className={`text-[11px] ml-1 font-semibold ${highlightFCFGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({highlightFCFGrowth > 0 ? '+' : ''}{highlightFCFGrowth}%)
                      </span>
                    )}
                  </div>
                )}

                {highlightGrossMargin != null && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <span className="text-slate-400">Gross Margin: </span>
                    <strong className="text-emerald-400 font-mono">{highlightGrossMargin}%</strong>
                  </div>
                )}
              </div>
            </div>

            {/* ── TAB: KPI Dashboard & Charts ── */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                {/* KPI Cards (using KpiCards.jsx which has the company banner + grid) */}
                <KpiCards data={kpiCardsData} />

                {/* Interactive Recharts Section */}
                <ChartsSection
                  chartTrends={chartTrends}
                  productCategories={appData.productMixData}
                  analytics={analytics}
                />

                {/* Key Financial Takeaways */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4" />
                      Operating Profitability
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Operating Income reached{' '}
                      <strong className="text-white">
                        {rawData?.kpis?.operating_income?.value != null
                          ? `$${(rawData.kpis.operating_income.value / 1000).toFixed(2)}B`
                          : 'N/A'}
                      </strong>
                      {rawData?.kpis?.operating_income?.yoy_growth != null && (
                        <span className={`ml-1 font-semibold ${rawData.kpis.operating_income.yoy_growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({rawData.kpis.operating_income.yoy_growth > 0 ? '+' : ''}{rawData.kpis.operating_income.yoy_growth}%)
                        </span>
                      )}, reflecting core business operational performance.
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Source: Consolidated Financial Statements</span>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      Tax & Non-Operating Impact
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tax provisions of{' '}
                      <strong className="text-amber-300">
                        {statements?.income_statement?.tax_provision?.[rawData?.fiscal_years?.[0]] != null
                          ? `$${(Math.abs(statements.income_statement.tax_provision[rawData.fiscal_years[0]]) / 1000).toFixed(2)}B`
                          : 'N/A'}
                      </strong> were recognized in the latest audited fiscal year.
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Source: Notes & Statements of Operations</span>
                  </div>

                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <Coins className="w-4 h-4" />
                      Capital Return & Free Cash Flow
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Free Cash Flow reached{' '}
                      <strong className="text-white">
                        {highlightFCF != null ? `$${(highlightFCF / 1000).toFixed(2)}B` : 'N/A'}
                      </strong>, powering ongoing business investments and shareholder value creation.
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">Source: Consolidated Statements of Cash Flows</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Financial Statements ── */}
            {activeTab === 'statements' && (
              <div className="animate-fadeIn">
                <FinancialTables
                  rawStatements={statements}
                  fiscalYears={rawData?.fiscal_years || ['2024', '2023', '2022']}
                  ratios={rawData?.ratios}
                  validation={validation}
                />
              </div>
            )}

            {/* ── TAB: Analytics & Ratios ── */}
            {activeTab === 'ratios' && (
              <div className="space-y-6 animate-fadeIn">
                <FinancialRatios data={ratiosData} />
                <ValidationAudit data={validationData} />
              </div>
            )}
          </>
        )}
      </>
    )}

      </main>

      {/* Floating RAG Chatbot Drawer */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedDoc={currentDoc || rawData?.source_document || 'Apple.pdf'}
        documents={availableDocs}
        onSelectDoc={(doc) => {
          if (doc && doc !== 'all') {
            setCurrentDoc(doc);
            fetchData(doc);
          }
        }}
        onDeleteDoc={handleDeleteDoc}
      />

      {/* Annual Report Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Grounded in SEC Form 10-K · Strictly Zero Hallucination Financial Extraction
          </span>
          <span className="text-[11px] text-slate-400">
            Powered by FastAPI · ChromaDB · Sentence Transformers · Gemini Flash
          </span>
        </div>
      </footer>

    </div>
  );
}
