import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Trophy, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  PieChart, 
  Info, 
  RefreshCw, 
  Sparkles, 
  Scale, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronDown,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { fetchAvailableCompanies, compareCompaniesAPI } from '../services/api';

// Distinct colors for up to 4 companies
const COMPANY_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

// Helper to format currency numbers safely
function formatCurrency(val, currency = 'USD', unit = 'millions') {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  const currSym = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : `${currency} `;
  
  if (absVal >= 1000) {
    return `${sign}${currSym}${(absVal / 1000).toFixed(2)}B`;
  }
  return `${sign}${currSym}${absVal.toFixed(1)}M`;
}

// Helper to format percentage values safely
function formatPct(val) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${Number(val).toFixed(1)}%`;
}

// Helper to format ratios safely
function formatRatio(val) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return `${Number(val).toFixed(2)}x`;
}

export default function CompanyComparison() {
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);
  const [error, setError] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('revenue');
  const [showMethodology, setShowMethodology] = useState(false);

  // Fetch available companies list on mount
  useEffect(() => {
    fetchAvailable();
  }, []);

  const fetchAvailable = async () => {
    setFetchingList(true);
    setError(null);
    try {
      const json = await fetchAvailableCompanies();
      const list = json.companies || [];
      setAvailableCompanies(list);

      // Default select first 2 companies if available
      if (list.length >= 2) {
        // Prefer Apple and Tesla if present
        const apple = list.find(c => c.company_name.toLowerCase().includes('apple'));
        const tesla = list.find(c => c.company_name.toLowerCase().includes('tesla'));
        const initial = apple && tesla 
          ? [apple.id, tesla.id] 
          : [list[0].id, list[1].id];
        setSelectedIds(initial);
        runComparison(initial);
      } else if (list.length === 1) {
        setSelectedIds([list[0].id]);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError(err.message || 'Failed to fetch available companies for comparison.');
    } finally {
      setFetchingList(false);
    }
  };

  const runComparison = async (overrideIds = null) => {
    const idsToCompare = overrideIds || selectedIds;
    if (idsToCompare.length < 2 || idsToCompare.length > 4) {
      setError('Please select between 2 and 4 companies to compare.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await compareCompaniesAPI(idsToCompare);
      setComparisonData(json.data);
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err.message || 'Comparison request failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        setError('At least 2 companies are required for comparison.');
        return;
      }
      setSelectedIds(selectedIds.filter(x => x !== id));
      setError(null);
    } else {
      if (selectedIds.length >= 4) {
        setError('Maximum 4 companies can be compared simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
      setError(null);
    }
  };

  // Quick preset helper
  const handlePreset = (keywords) => {
    const matched = [];
    for (const kw of keywords) {
      const found = availableCompanies.find(c => 
        c.company_name.toLowerCase().includes(kw.toLowerCase()) || 
        c.id.toLowerCase().includes(kw.toLowerCase())
      );
      if (found && !matched.includes(found.id)) {
        matched.push(found.id);
      }
    }
    if (matched.length >= 2) {
      setSelectedIds(matched);
      runComparison(matched);
    }
  };

  // Helper to get color for a company index or id
  const getCompanyColor = (cid) => {
    if (!comparisonData?.companies) return '#6366f1';
    const idx = comparisonData.companies.findIndex(c => c.id === cid);
    return COMPANY_COLORS[idx >= 0 ? idx % COMPANY_COLORS.length : 0];
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* ── Top Header & Selection Panel ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 shadow-2xl relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              Multi-Company Financial Analysis
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Company Comparison Engine
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Compare 2 to 4 SEC 10-K audited filings side-by-side. Our deterministic engine normalizes operating margins, leverage ratios, and cash flows without size bias.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => runComparison()}
              disabled={loading || selectedIds.length < 2 || selectedIds.length > 4}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all ${
                loading || selectedIds.length < 2 || selectedIds.length > 4
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white shadow-indigo-500/25 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing Filings...' : 'Run Comparison'}</span>
            </button>
          </div>
        </div>

        {/* ── Selection Chips & Available Companies ── */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span>Select Companies:</span>
              <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                selectedIds.length >= 2 && selectedIds.length <= 4
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {selectedIds.length} / 4 Selected (min 2)
              </span>
            </div>

            {/* Quick Presets */}
            {availableCompanies.length >= 2 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500">Quick Compare:</span>
                <button
                  type="button"
                  onClick={() => handlePreset(['apple', 'tesla'])}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all text-xs"
                >
                  Apple vs Tesla
                </button>
                {availableCompanies.some(c => c.company_name.toLowerCase().includes('walmart')) && (
                  <button
                    type="button"
                    onClick={() => handlePreset(['apple', 'tesla', 'walmart'])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all text-xs"
                  >
                    Apple vs Tesla vs Walmart
                  </button>
                )}
                {availableCompanies.some(c => c.company_name.toLowerCase().includes('nvidia')) && (
                  <button
                    type="button"
                    onClick={() => handlePreset(['apple', 'tesla', 'nvidia'])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all text-xs"
                  >
                    Apple vs Tesla vs NVIDIA
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Companies Toggle Chips */}
          {fetchingList ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Scanning cached SEC filings...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableCompanies.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCompany(c.id)}
                    className={`flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="font-semibold text-xs text-white truncate block">
                          {c.company_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          FY {c.latest_year}
                        </span>
                        <span>{c.currency}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                      isSelected 
                        ? 'bg-indigo-500 border-indigo-400 text-white' 
                        : 'border-slate-700 bg-slate-800/50 text-transparent'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Comparison Dashboard (Rendered when comparison data is available) ── */}
      {comparisonData && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* ── Timing Discrepancy Alert Banner ── */}
          {comparisonData.has_timing_difference && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-amber-300">
                  ⚠️ Fiscal Timing Notice
                </span>
                <p className="text-amber-200/90 leading-relaxed text-xs">
                  Companies in this comparison report on different fiscal year schedules (e.g., {comparisonData.companies.map(c => `${c.name}: FY ${c.latest_year}`).join(', ')}). Compare results with this calendar timing difference in mind.
                </p>
                {comparisonData.disclaimers?.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] text-amber-300/80 pt-1 space-y-0.5">
                    {comparisonData.disclaimers.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Deterministic Scorecard: "Which Company Performs Better?" ── */}
          {comparisonData.scorecard && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Deterministic Multi-Category Performance Engine
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                    Performance Scorecard & Category Leaders
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Scores are computed deterministically (5.0 - 10.0 scale) based on growth, margins, solvency, and cash generation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMethodology(!showMethodology)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all self-start sm:self-center"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showMethodology ? 'Hide Methodology' : 'Scoring Methodology'}</span>
                </button>
              </div>

              {/* Methodology Explanation Drawer */}
              {showMethodology && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 space-y-2 animate-fadeIn">
                  <span className="font-semibold text-indigo-300 block">
                    Transparent Scoring Weights & Normalization:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block">💎 Profitability</span>
                      <strong className="text-white text-sm">30% Weight</strong>
                      <p className="text-slate-500 text-[10px] mt-1">Gross Margin, Operating Margin, Net Profit Margin</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block">🚀 Growth</span>
                      <strong className="text-white text-sm">25% Weight</strong>
                      <p className="text-slate-500 text-[10px] mt-1">YoY Revenue Growth & Net Income Growth</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block">🛡️ Financial Health</span>
                      <strong className="text-white text-sm">25% Weight</strong>
                      <p className="text-slate-500 text-[10px] mt-1">Current Ratio & Low Debt-to-Equity</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block">⚡ Cash Flow</span>
                      <strong className="text-white text-sm">20% Weight</strong>
                      <p className="text-slate-500 text-[10px] mt-1">Free Cash Flow Margin & Conversion %</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic pt-1">
                    * Metrics are normalized against the comparison group. No raw market caps or dollar billions are used to determine scores, giving fast-growing or high-efficiency businesses equal footing.
                  </p>
                </div>
              )}

              {/* Overall Winner Spotlight Card */}
              {comparisonData.scorecard.category_winners?.overall && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg">
                      <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 block">
                        Overall Performance Leader
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {comparisonData.scorecard.category_winners.overall.company_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Achieved the highest composite score across all audited dimensions.
                      </p>
                    </div>
                  </div>
                  <div className="text-right self-start sm:self-center">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                      {comparisonData.scorecard.category_winners.overall.score}
                    </span>
                    <span className="text-slate-500 text-xs font-mono ml-1">/ 10.0</span>
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Composite Score
                    </span>
                  </div>
                </div>
              )}

              {/* Category Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Growth */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Growth (25%)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold">
                      {comparisonData.scorecard.category_winners?.growth?.score} / 10
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    Winner: {comparisonData.scorecard.category_winners?.growth?.company_name}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    {comparisonData.companies.map(c => {
                      const s = comparisonData.scorecard.scores_by_company?.[c.id]?.growth;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[120px]">{c.name}</span>
                          <span className="font-mono text-slate-200">{s ?? '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Profitability */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Profitability (30%)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-bold">
                      {comparisonData.scorecard.category_winners?.profitability?.score} / 10
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    Winner: {comparisonData.scorecard.category_winners?.profitability?.company_name}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    {comparisonData.companies.map(c => {
                      const s = comparisonData.scorecard.scores_by_company?.[c.id]?.profitability;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[120px]">{c.name}</span>
                          <span className="font-mono text-slate-200">{s ?? '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Financial Health */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Solvency & Health (25%)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 font-bold">
                      {comparisonData.scorecard.category_winners?.financial_health?.score} / 10
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    Winner: {comparisonData.scorecard.category_winners?.financial_health?.company_name}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    {comparisonData.companies.map(c => {
                      const s = comparisonData.scorecard.scores_by_company?.[c.id]?.financial_health;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[120px]">{c.name}</span>
                          <span className="font-mono text-slate-200">{s ?? '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Cash Flow Strength */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Cash Flow (20%)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold">
                      {comparisonData.scorecard.category_winners?.cash_flow?.score} / 10
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    Winner: {comparisonData.scorecard.category_winners?.cash_flow?.company_name}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    {comparisonData.companies.map(c => {
                      const s = comparisonData.scorecard.scores_by_company?.[c.id]?.cash_flow;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[120px]">{c.name}</span>
                          <span className="font-mono text-slate-200">{s ?? '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── Interactive Comparison Visualizations (Recharts) ── */}
          {comparisonData.charts && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4" />
                    Comparative Visual Analytics
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                    Side-by-Side Financial Visualizations
                  </h2>
                </div>

                {/* Visual Tab Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-center flex-wrap">
                  {[
                    { id: 'revenue', label: 'Revenue ($B)' },
                    { id: 'net_income', label: 'Net Income ($B)' },
                    { id: 'margins', label: 'Margins (%)' },
                    { id: 'growth', label: 'YoY Growth (%)' },
                    { id: 'fcf', label: 'Free Cash Flow ($B)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveChartTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                        activeChartTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Render Container */}
              <div className="h-80 w-full pt-4">
                
                {/* 1. Revenue Chart */}
                {activeChartTab === 'revenue' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.charts.revenue} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="company" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="B" tickFormatter={v => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val, name, item) => [`$${val} Billion (FY ${item.payload.year})`, 'Latest Revenue']}
                      />
                      <Bar dataKey="revenue_b" radius={[8, 8, 0, 0]}>
                        {comparisonData.charts.revenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COMPANY_COLORS[index % COMPANY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* 2. Net Income Chart */}
                {activeChartTab === 'net_income' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.charts.net_income} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="company" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="B" tickFormatter={v => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val, name, item) => [`$${val} Billion (FY ${item.payload.year})`, 'Net Income']}
                      />
                      <Bar dataKey="net_income_b" radius={[8, 8, 0, 0]}>
                        {comparisonData.charts.net_income.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COMPANY_COLORS[index % COMPANY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* 3. Margins Multi-Bar Chart */}
                {activeChartTab === 'margins' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.charts.margins} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="company" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" tickFormatter={v => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val) => [`${val}%`, 'Margin']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      <Bar dataKey="gross_margin" name="Gross Margin %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="operating_margin" name="Operating Margin %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net_margin" name="Net Margin %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* 4. Growth Rates */}
                {activeChartTab === 'growth' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.charts.growth} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="company" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" tickFormatter={v => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val) => [`${val}%`, 'YoY Growth']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                      <Bar dataKey="revenue_growth" name="Revenue Growth (YoY)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net_income_growth" name="Net Income Growth (YoY)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* 5. Free Cash Flow Chart */}
                {activeChartTab === 'fcf' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.charts.free_cash_flow} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="company" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="B" tickFormatter={v => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(val, name, item) => [`$${val} Billion (FY ${item.payload.year})`, 'Free Cash Flow']}
                      />
                      <Bar dataKey="free_cash_flow_b" radius={[8, 8, 0, 0]}>
                        {comparisonData.charts.free_cash_flow.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COMPANY_COLORS[index % COMPANY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

              </div>

            </div>
          )}

          {/* ── Tabular KPI Comparison Table ── */}
          {comparisonData.comparison_table && (
            <div className="glass-panel rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  Audited Line Items & Ratios
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Side-by-Side Financial Statement Matrix
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted directly from audited 10-K statements with deterministic formula derivations.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-4 px-6 w-1/3">Financial Metric</th>
                      {comparisonData.companies.map((c, idx) => (
                        <th key={c.id} className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-white font-bold text-xs" style={{ color: COMPANY_COLORS[idx % COMPANY_COLORS.length] }}>
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              FY {c.latest_year} · {c.currency}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-800/60">
                    {comparisonData.comparison_table.map((row, idx) => {
                      if (row.is_header) {
                        return (
                          <tr key={idx} className="bg-slate-950/50">
                            <td 
                              colSpan={comparisonData.companies.length + 1} 
                              className="py-3 px-6 text-xs font-bold text-indigo-300 uppercase tracking-wider"
                            >
                              {row.label}
                            </td>
                          </tr>
                        );
                      }

                      // Find max value in row to highlight the leader
                      const numericValues = Object.entries(row.values || {})
                        .filter(([_, v]) => v !== null && v !== undefined && !isNaN(v))
                        .map(([cid, v]) => ({ cid, val: Number(v) }));
                      
                      const maxEntry = numericValues.length > 1
                        ? numericValues.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), numericValues[0])
                        : null;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-6 font-medium text-slate-300">
                            {row.label}
                          </td>
                          {comparisonData.companies.map((c) => {
                            const val = row.values?.[c.id];
                            const isLeader = maxEntry && maxEntry.cid === c.id && val !== null && val !== undefined;

                            let formatted = 'N/A';
                            if (row.format === 'currency') {
                              formatted = formatCurrency(val, c.currency, c.unit);
                            } else if (row.format === 'pct') {
                              formatted = formatPct(val);
                            } else if (row.format === 'ratio') {
                              formatted = formatRatio(val);
                            } else if (row.format === 'per_share') {
                              formatted = val != null ? `$${Number(val).toFixed(2)}` : 'N/A';
                            } else {
                              formatted = val != null ? String(val) : 'N/A';
                            }

                            return (
                              <td key={c.id} className="py-3.5 px-6 text-right font-mono">
                                <span className={`inline-flex items-center gap-1.5 ${
                                  val === null || val === undefined 
                                    ? 'text-slate-600' 
                                    : row.format === 'pct' && val < 0
                                    ? 'text-rose-400'
                                    : isLeader
                                    ? 'text-emerald-400 font-bold'
                                    : 'text-slate-200'
                                }`}>
                                  {formatted}
                                  {isLeader && numericValues.length > 1 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Leading metric" />
                                  )}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>

            </div>
          )}

          {/* ── Grounded AI Comparative Analysis ── */}
          {comparisonData.ai_summary && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-6">
              
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Grounded AI Executive Comparative Analysis
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight -mt-4">
                Executive Synthesis & Strategic Trade-offs
              </h2>

              {/* Executive Summary Paragraph */}
              {comparisonData.ai_summary.executive_summary && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 leading-relaxed">
                  <p>{comparisonData.ai_summary.executive_summary}</p>
                </div>
              )}

              {/* Category Breakdowns */}
              {comparisonData.ai_summary.category_breakdowns && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(comparisonData.ai_summary.category_breakdowns).map(([catKey, text]) => {
                    const catTitle = catKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <div key={catKey} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {catTitle} Insight
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Key Tradeoffs */}
              {comparisonData.ai_summary.key_tradeoffs?.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Key Comparative Trade-offs
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {comparisonData.ai_summary.key_tradeoffs.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regulatory Disclaimer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {comparisonData.ai_summary.regulatory_disclaimer || 
                   'This comparison is generated deterministically from audited SEC 10-K filings for analytical and benchmarking purposes. It does not constitute investment advice or recommendation.'}
                </span>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
