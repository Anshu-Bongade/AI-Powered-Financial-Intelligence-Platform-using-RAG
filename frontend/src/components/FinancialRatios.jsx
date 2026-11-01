import React from 'react';
import {
  Percent,
  Activity,
  Layers,
  ArrowUpRight,
  HelpCircle,
  CheckCircle,
  Scale
} from 'lucide-react';
import { formatPct, formatRatio, formatCurrency } from '../utils/formatters';

export default function FinancialRatios({ data }) {
  if (!data || !data.ratios) return null;

  const { ratios, fiscal_years = ['2024', '2023'] } = data;
  const latestYear = fiscal_years[0];
  const prevYear = fiscal_years[1];

  const latestRatios = ratios[latestYear] || {};
  const prevRatios = ratios[prevYear] || {};

  const prof = latestRatios.profitability || {};
  const prevProf = prevRatios.profitability || {};

  const liq = latestRatios.liquidity_solvency || {};
  const prevLiq = prevRatios.liquidity_solvency || {};

  const cf = latestRatios.cash_flow || {};
  const prevCf = prevRatios.cash_flow || {};

  const ratioCategories = [
    {
      title: 'Profitability Ratios',
      icon: Percent,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Measures company ability to generate earnings relative to revenue and balance sheet capital.',
      items: [
        {
          name: 'Gross Profit Margin',
          formula: 'Gross Margin / Total Revenue',
          val: prof.gross_margin_pct ? `${prof.gross_margin_pct}%` : 'N/A',
          prevVal: prevProf.gross_margin_pct ? `${prevProf.gross_margin_pct}%` : 'N/A',
          status: 'Excellent (46.2%)',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Revenue left after direct cost of goods & services'
        },
        {
          name: 'Operating Margin (EBIT Margin)',
          formula: 'Operating Income / Total Revenue',
          val: prof.operating_margin_pct ? `${prof.operating_margin_pct}%` : 'N/A',
          prevVal: prevProf.operating_margin_pct ? `${prevProf.operating_margin_pct}%` : 'N/A',
          status: 'High (31.5%)',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Core operational efficiency before interest & taxes'
        },
        {
          name: 'Net Profit Margin',
          formula: 'Net Income / Total Revenue',
          val: prof.net_margin_pct ? `${prof.net_margin_pct}%` : 'N/A',
          prevVal: prevProf.net_margin_pct ? `${prevProf.net_margin_pct}%` : 'N/A',
          status: 'Strong (24.0%)',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Final bottom-line net income percentage'
        },
        {
          name: 'Return on Assets (ROA)',
          formula: 'Net Income / Total Assets',
          val: prof.return_on_assets_roa_pct ? `${prof.return_on_assets_roa_pct}%` : 'N/A',
          prevVal: prevProf.return_on_assets_roa_pct ? `${prevProf.return_on_assets_roa_pct}%` : 'N/A',
          status: 'Top Tier (25.7%)',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Effectiveness of asset utilization in generating net earnings'
        },
        {
          name: 'Return on Equity (ROE)',
          formula: 'Net Income / Shareholders Equity',
          val: prof.return_on_equity_roe_pct ? `${prof.return_on_equity_roe_pct}%` : 'N/A',
          prevVal: prevProf.return_on_equity_roe_pct ? `${prevProf.return_on_equity_roe_pct}%` : 'N/A',
          status: 'Industry Leading (164.6%)',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Elevated by strategic multi-year share repurchases shrinking equity base'
        },
        {
          name: 'R&D Intensity',
          formula: 'R&D Expense / Total Revenue',
          val: prof.rd_intensity_pct ? `${prof.rd_intensity_pct}%` : 'N/A',
          prevVal: prevProf.rd_intensity_pct ? `${prevProf.rd_intensity_pct}%` : 'N/A',
          status: 'Stable (~8%)',
          statusColor: 'text-blue-400 bg-blue-500/10',
          desc: 'Reinvestment into product engineering and proprietary silicon'
        }
      ]
    },
    {
      title: 'Liquidity, Solvency & Efficiency',
      icon: Scale,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      description: 'Assesses short-term working capital obligation coverage and long-term capital leverage.',
      items: [
        {
          name: 'Current Ratio',
          formula: 'Current Assets / Current Liabilities',
          val: liq.current_ratio ? formatRatio(liq.current_ratio, '') : 'N/A',
          prevVal: prevLiq.current_ratio ? formatRatio(prevLiq.current_ratio, '') : 'N/A',
          status: 'Lean Working Capital',
          statusColor: 'text-amber-400 bg-amber-500/10',
          desc: 'Apple manages negative working capital through negative cash conversion cycle'
        },
        {
          name: 'Working Capital',
          formula: 'Current Assets - Current Liabilities',
          val: liq.working_capital !== null ? formatCurrency(liq.working_capital, '$', 'M') : 'N/A',
          prevVal: prevLiq.working_capital !== null ? formatCurrency(prevLiq.working_capital, '$', 'M') : 'N/A',
          status: 'Negative Working Capital',
          statusColor: 'text-slate-400 bg-slate-800',
          desc: 'Suppliers finance inventory with fast collection from customers'
        },
        {
          name: 'Cash & Quick Ratio',
          formula: '(Cash + Marketable Securities) / Current Liab',
          val: liq.cash_ratio ? formatRatio(liq.cash_ratio, '') : 'N/A',
          prevVal: prevLiq.cash_ratio ? formatRatio(prevLiq.cash_ratio, '') : 'N/A',
          status: 'Adequate Liquidity',
          statusColor: 'text-blue-400 bg-blue-500/10',
          desc: 'Direct liquid reserves against short-term bills'
        },
        {
          name: 'Debt-to-Equity',
          formula: 'Total Debt / Shareholders Equity',
          val: liq.debt_to_equity ? formatRatio(liq.debt_to_equity, 'x') : 'N/A',
          prevVal: prevLiq.debt_to_equity ? formatRatio(prevLiq.debt_to_equity, 'x') : 'N/A',
          status: 'Moderate Leverage',
          statusColor: 'text-blue-400 bg-blue-500/10',
          desc: 'Low-cost debt utilized to fund buybacks and dividends'
        },
        {
          name: 'Asset Turnover',
          formula: 'Total Revenue / Total Assets',
          val: liq.asset_turnover ? formatRatio(liq.asset_turnover, 'x') : 'N/A',
          prevVal: prevLiq.asset_turnover ? formatRatio(prevLiq.asset_turnover, 'x') : 'N/A',
          status: 'High Efficiency',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Annual sales generated per dollar of asset employed'
        }
      ]
    },
    {
      title: 'Cash Flow Quality & Conversion',
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      description: 'Evaluates real cash backing of accounting profits and surplus cash generation.',
      items: [
        {
          name: 'Free Cash Flow (FCF)',
          formula: 'Operating Cash Flow - CapEx',
          val: cf.free_cash_flow !== null ? formatCurrency(cf.free_cash_flow, '$', 'M') : 'N/A',
          prevVal: prevCf.free_cash_flow !== null ? formatCurrency(prevCf.free_cash_flow, '$', 'M') : 'N/A',
          status: 'Exceptional (+$108.8B)',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Discretionary cash after maintaining and expanding capital equipment'
        },
        {
          name: 'FCF Conversion Rate',
          formula: 'Free Cash Flow / Net Income',
          val: cf.fcf_conversion_pct ? `${cf.fcf_conversion_pct}%` : 'N/A',
          prevVal: prevCf.fcf_conversion_pct ? `${prevCf.fcf_conversion_pct}%` : 'N/A',
          status: '>100% Cash Quality',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Every dollar of accounting net income generates >$1.16 of real free cash'
        },
        {
          name: 'Operating Cash Flow to Net Income',
          formula: 'Operating Cash Flow / Net Income',
          val: cf.ocf_to_net_income ? formatRatio(cf.ocf_to_net_income, 'x') : 'N/A',
          prevVal: prevCf.ocf_to_net_income ? formatRatio(prevCf.ocf_to_net_income, 'x') : 'N/A',
          status: 'High Earnings Quality',
          statusColor: 'text-emerald-400 bg-emerald-500/10',
          desc: 'Operating cash exceeds reported net income by ~26%'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {ratioCategories.map((cat, idx) => {
        const Icon = cat.icon;
        return (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <div className={`p-2 rounded-xl border ${cat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-400">{cat.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {cat.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.formula}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xl font-bold font-mono text-white">
                        {item.val}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        FY{latestYear}
                      </span>
                    </div>

                    {item.prevVal && item.prevVal !== 'N/A' && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Prev: <span className="text-slate-300">{item.prevVal}</span> (FY{prevYear})
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
