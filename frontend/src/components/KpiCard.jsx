import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  CheckCircle2, 
  Calculator,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function KpiCard({ kpi }) {
  const [showCitation, setShowCitation] = useState(false);
  const isPositive = kpi.yoy_change !== null && kpi.yoy_change > 0;
  const isNeutral = kpi.yoy_change === 0 || kpi.yoy_change === null;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header: Title & Badges */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {kpi.title}
          </span>
          <div className="flex items-center gap-1.5">
            {kpi.confidence === 'audited' ? (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Audited SEC GAAP figure">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Audited
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20" title="Calculated using verified statement inputs">
                <Calculator className="w-2.5 h-2.5" />
                Calculated
              </span>
            )}
          </div>
        </div>

        {/* Primary Metric Value & YoY Growth Pill */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {kpi.formatted_value}
          </div>

          {kpi.yoy_text && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isPositive 
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                : isNeutral 
                  ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : isNeutral ? null : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span>{kpi.yoy_text}</span>
            </div>
          )}
        </div>

        {/* Reporting Unit & Fiscal Period */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>{kpi.period}</span>
          <span className="text-[11px] text-slate-400 font-mono">Unit: {kpi.unit}</span>
        </div>

        {/* Footnote note if any (e.g. Ireland tax ruling) */}
        {kpi.impact_note && (
          <div className="mt-2.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-tight">
            ⚠️ {kpi.impact_note}
          </div>
        )}
      </div>

      {/* 3-Year Historical Mini Trend */}
      {kpi.history && kpi.history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span>3-Yr Trend (FY22 - FY24)</span>
            <span className="font-mono text-slate-300">
              {kpi.history[kpi.history.length - 1]?.value?.toLocaleString() || '-'} {kpi.currency === '%' ? '%' : 'M'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {kpi.history.map((h, idx) => {
              const maxVal = Math.max(...kpi.history.map(x => x.value || 0));
              const heightPct = h.value && maxVal > 0 ? Math.max(20, Math.round((h.value / maxVal) * 100)) : 10;
              const isCurrent = idx === kpi.history.length - 1;

              return (
                <div key={h.year} className="flex flex-col items-center">
                  <div className="w-full bg-slate-800/70 h-8 rounded flex items-end p-0.5">
                    <div 
                      className={`w-full rounded-sm transition-all duration-500 ${
                        isCurrent 
                          ? 'bg-gradient-to-t from-indigo-500 to-sky-400' 
                          : 'bg-slate-600/60'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${h.year}: ${h.value !== null ? h.value.toLocaleString() : 'Not reported'}`}
                    />
                  </div>
                  <span className={`text-[10px] mt-1 ${isCurrent ? 'text-sky-400 font-bold' : 'text-slate-400'}`}>
                    '{h.year.slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expandable Source Citation */}
      <div className="mt-3 pt-2">
        <button
          onClick={() => setShowCitation(!showCitation)}
          className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-300 transition-colors"
        >
          <span className="flex items-center gap-1 font-mono">
            <Info className="w-3 h-3 text-slate-400" />
            Source Citation
          </span>
          {showCitation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showCitation && (
          <div className="mt-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1 animate-fadeIn">
            <p className="text-slate-400 font-mono text-[10px]">
              Document: <span className="text-slate-200">{kpi.source_doc}</span>
            </p>
            <p className="text-slate-300 leading-snug">
              {kpi.citation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
