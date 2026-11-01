import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Percent,
  Wallet,
  Coins,
  Building2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatPct, formatPerShare } from '../utils/formatters';

export default function KpiCards({ data }) {
  if (!data || !data.kpis) return null;

  const { kpis, currency = 'USD', unit = 'millions', validation } = data;
  const isAudited = validation?.status === 'PASSED';

  const cards = [
    {
      title: 'Total Net Sales (Revenue)',
      value: formatCurrency(kpis.revenue?.value, '$', 'M'),
      rawVal: kpis.revenue?.value,
      growth: kpis.revenue?.yoy_growth,
      subtitle: `FY${kpis.latest_year} reported revenue`,
      icon: DollarSign,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Net Income',
      value: formatCurrency(kpis.net_income?.value, '$', 'M'),
      rawVal: kpis.net_income?.value,
      growth: kpis.net_income?.yoy_growth,
      subtitle: `Net earnings after tax provision`,
      icon: Wallet,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Operating Income (EBIT)',
      value: formatCurrency(kpis.operating_income?.value, '$', 'M'),
      rawVal: kpis.operating_income?.value,
      growth: kpis.operating_income?.yoy_growth,
      subtitle: `Gross profit minus R&D and SG&A`,
      icon: TrendingUp,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Gross Margin %',
      value: kpis.gross_margin_pct?.value != null ? `${kpis.gross_margin_pct.value}%` : 'N/A',
      rawVal: kpis.gross_margin_pct?.value,
      growth: null,
      badge: kpis.gross_margin_pct?.value != null ? `${kpis.gross_margin_pct.value}% of Net Sales` : null,
      subtitle: 'Gross revenue profitability',
      icon: Percent,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Free Cash Flow (FCF)',
      value: formatCurrency(kpis.free_cash_flow?.value, '$', 'M'),
      rawVal: kpis.free_cash_flow?.value,
      growth: kpis.free_cash_flow?.yoy_growth,
      subtitle: 'Operating Cash Flow minus CapEx',
      icon: Coins,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
      title: 'Diluted EPS',
      value: formatPerShare(kpis.diluted_eps?.value),
      rawVal: kpis.diluted_eps?.value,
      growth: kpis.diluted_eps?.yoy_growth,
      subtitle: 'Per common share (diluted)',
      icon: PieChart,
      color: 'from-violet-500/20 to-indigo-500/10 border-violet-500/30 text-violet-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Company Info & Verification Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {data.company_name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {data.document_title}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
            <span>Reporting Units: <strong className="text-slate-200">USD Millions</strong></span>
            <span>•</span>
            <span>Source Filing: <strong className="text-slate-200">{data.source_document}</strong></span>
            <span>•</span>
            <span>Fiscal Years: <strong className="text-slate-200">{data.fiscal_years?.join(', ')}</strong></span>
          </p>
        </div>

        {/* Audit Status Pill */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border ${
            isAudited
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAudited
                ? `AUDITED & VERIFIED (${validation?.passed_checks}/${validation?.total_checks} Checks Passed)`
                : 'VERIFICATION PENDING'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isGrowthPositive = card.growth !== null && card.growth !== undefined && card.growth >= 0;
          const hasGrowth = card.growth !== null && card.growth !== undefined;

          return (
            <div
              key={idx}
              className="group relative p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-2xl font-extrabold tracking-tight text-white font-mono">
                  {card.value}
                </div>

                {hasGrowth && (
                  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isGrowthPositive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isGrowthPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{formatPct(card.growth)} YoY</span>
                  </div>
                )}

                {card.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {card.badge}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Balance Sheet Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Total Assets ({kpis.latest_year})
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatCurrency(kpis.total_assets?.value, '$', 'M')}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <DollarSign className="w-5 h-5 text-rose-400" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Total Liabilities ({kpis.latest_year})
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatCurrency(kpis.total_liabilities?.value, '$', 'M')}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Shareholders' Equity ({kpis.latest_year})
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatCurrency(kpis.shareholders_equity?.value, '$', 'M')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
