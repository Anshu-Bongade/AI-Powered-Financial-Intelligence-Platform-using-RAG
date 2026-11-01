import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area
} from 'recharts';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Wallet, 
  Layers, 
  Sparkles 
} from 'lucide-react';

export default function ChartsSection({ chartTrends, productCategories, analytics }) {
  const [activeChart, setActiveChart] = useState('revenue_profit');

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label, unit = '$' }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[180px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
            Fiscal Year {label}
          </div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {unit === '$' 
                  ? `$${(entry.value / 1000).toFixed(2)}B` 
                  : `${entry.value.toFixed(2)}%`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Interactive Financial Analytics
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              Audited 10-K Data
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore 3-year performance trends, profitability margins, product segment breakdown, and cash flow dynamics.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveChart('revenue_profit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeChart === 'revenue_profit'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Revenue & Profit
          </button>

          <button
            onClick={() => setActiveChart('margins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeChart === 'margins'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            Margin Trends (%)
          </button>

          <button
            onClick={() => setActiveChart('segments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeChart === 'segments'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            Product Mix
          </button>

          <button
            onClick={() => setActiveChart('cash_flow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeChart === 'cash_flow'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Cash Flow & FCF
          </button>

          <button
            onClick={() => setActiveChart('balance_sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeChart === 'balance_sheet'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Capital Structure
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-[360px] w-full mt-4">
        {activeChart === 'revenue_profit' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}B`}
              />
              <Tooltip content={<CustomTooltip unit="$" />} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
              
              <Bar dataKey="revenue" name="Total Net Sales" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gross_margin" name="Gross Margin" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="operating_income" name="Operating Income" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="net_income" name="Net Income" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'margins' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[20, 50]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip unit="%" />} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
              
              <Line type="monotone" dataKey="gross_margin_pct" name="Gross Margin %" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5, fill: '#38bdf8' }} />
              <Line type="monotone" dataKey="operating_margin_pct" name="Operating Margin %" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
              <Line type="monotone" dataKey="net_margin_pct" name="Net Margin %" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'segments' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={productCategories || []} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}B`}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748b" 
                tick={{ fill: '#e2e8f0', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip unit="$" />} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />

              <Bar dataKey="2024" name="FY 2024" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="2023" name="FY 2023" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              <Bar dataKey="2022" name="FY 2022" fill="#64748b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'cash_flow' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}B`}
              />
              <Tooltip content={<CustomTooltip unit="$" />} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />

              <Bar dataKey="operating_cash_flow" name="Operating Cash Flow" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="capex" name="CapEx (PP&E Acquisition)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="free_cash_flow" name="Free Cash Flow (FCF)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'balance_sheet' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartTrends.filter(x => x.total_assets !== null)} 
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}B`}
              />
              <Tooltip content={<CustomTooltip unit="$" />} />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />

              <Bar dataKey="total_assets" name="Total Assets" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="total_liabilities" name="Total Liabilities" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="equity" name="Shareholders' Equity" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Analytical Callout Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            {activeChart === 'revenue_profit' && (
              <>
                <strong className="text-white">Revenue Growth Driver:</strong> Services reached a historic high of <strong className="text-sky-300">$96.2B (+12.9% YoY)</strong>, lifting company gross margin to 46.2%.
              </>
            )}
            {activeChart === 'margins' && (
              <>
                <strong className="text-white">Margin Expansion:</strong> Gross Margin % expanded <strong className="text-emerald-300">+208 bps</strong> in 2024 to 46.21%, supported by high-margin cloud and advertising services.
              </>
            )}
            {activeChart === 'segments' && (
              <>
                <strong className="text-white">Product Share:</strong> iPhone represented <strong className="text-indigo-300">51.4% ($201.2B)</strong> of total net sales, followed by Services at 24.6% ($96.2B).
              </>
            )}
            {activeChart === 'cash_flow' && (
              <>
                <strong className="text-white">Cash Generation Quality:</strong> Free Cash Flow surged to <strong className="text-emerald-300">$108.81B</strong>, representing an outstanding <strong className="text-white">116.1%</strong> FCF-to-Net Income conversion rate.
              </>
            )}
            {activeChart === 'balance_sheet' && (
              <>
                <strong className="text-white">Asset-Liability Validation:</strong> Audited balance sheet satisfies <code className="text-indigo-300">Assets ($364.98B) = Liabilities ($308.03B) + Equity ($56.95B)</code>.
              </>
            )}
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">
          Source: SEC 10-K Audited Statements
        </span>
      </div>

    </div>
  );
}
