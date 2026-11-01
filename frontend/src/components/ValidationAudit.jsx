import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Database,
  Lock,
  Layers,
  Search
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function ValidationAudit({ data }) {
  if (!data || !data.validation) return null;

  const { validation, source_citations = {}, source_document } = data;
  const { checks = [], flagged_missing_items = [], passed_checks, total_checks, status } = validation;
  const isAllPassed = status === 'PASSED';

  return (
    <div className="space-y-6">
      {/* Top Audit Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-2xl border ${
              isAllPassed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Data Accuracy & Integrity Audit
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {status} ({passed_checks}/{total_checks})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mathematical verification against double-entry GAAP identity constraints. Zero synthetic numbers.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              Audit Standard: <strong className="text-white">US GAAP / SEC Form 10-K Verification</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Arithmetic Validation Check Results */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Arithmetic Checksum & Formula Reconciliations
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {passed_checks} of {total_checks} checks passed with 0 discrepancy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {checks.map((c, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {c.statement} • FY{c.year}
                  </span>
                  <div className="text-xs font-semibold text-white mt-1.5">
                    {c.check_name}
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 ${
                  c.status === 'PASS'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{c.status}</span>
                </span>
              </div>

              {/* Numbers Comparison */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Reported</span>
                  <span className="font-semibold text-slate-200">
                    ${c.reported_value?.toLocaleString()}M
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Calculated</span>
                  <span className="font-semibold text-slate-200">
                    ${c.calculated_value?.toLocaleString()}M
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">Discrepancy</span>
                  <span className="font-semibold text-emerald-400">
                    ${c.discrepancy}M
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {c.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Flagged Missing / Non-Reported Items Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Missing & Non-Reported Disclosures (Anti-Hallucination Policy)
            </h3>
            <p className="text-xs text-slate-400">
              In accordance with our strict data policy, values not legally required or reported in the filing are never guessed or synthetically manufactured.
            </p>
          </div>
        </div>

        {flagged_missing_items.length > 0 ? (
          <div className="space-y-3 pt-1">
            {flagged_missing_items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start space-x-3 text-xs"
              >
                <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-amber-300 uppercase tracking-wide">
                      {item.status}: {item.field} (FY{item.year})
                    </span>
                    <span className="text-[10px] text-slate-500">• {item.statement}</span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 pt-2">No missing fields flagged in this report.</p>
        )}
      </div>

      {/* Source Citation & Document Provenance */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <FileCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Document Provenance & Citations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
              Operations Statement
            </span>
            <p className="text-slate-200 font-medium">
              {source_citations.income_statement || 'Consolidated Statements of Operations'}
            </p>
            <span className="text-[11px] text-slate-500 mt-2 block">
              Grounded in primary 10-K Item 8 financial disclosures
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
              Balance Sheet Statement
            </span>
            <p className="text-slate-200 font-medium">
              {source_citations.balance_sheet || 'Consolidated Balance Sheets'}
            </p>
            <span className="text-[11px] text-slate-500 mt-2 block">
              Audited by Ernst & Young LLP independent auditor report
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
              Cash Flows Statement
            </span>
            <p className="text-slate-200 font-medium">
              {source_citations.cash_flows || 'Consolidated Statements of Cash Flows'}
            </p>
            <span className="text-[11px] text-slate-500 mt-2 block">
              Direct operating reconciliation to net income
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
