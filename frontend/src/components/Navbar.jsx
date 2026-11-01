import React from 'react';
import {
  TrendingUp,
  FileText,
  Upload,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Database
} from 'lucide-react';

export default function Navbar({
  documents = [],
  selectedDoc,
  onSelectDoc,
  onOpenUpload,
  onToggleChat,
  onRefresh,
  isRefreshing,
  health,
  activeTab,
  setActiveTab
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  FinSight AI
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  RAG Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated Financial Intelligence & Audited Dashboard
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Overview & KPIs
            </button>
            <button
              onClick={() => setActiveTab('statements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'statements'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Financial Tables
            </button>
            <button
              onClick={() => setActiveTab('ratios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ratios'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Ratios & Health
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'audit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit Checks</span>
            </button>
          </nav>

          {/* Document Selector & Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Document Dropdown */}
            <div className="relative flex items-center">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedDoc}
                onChange={(e) => onSelectDoc(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer hover:border-slate-600"
              >
                {documents.map((doc) => (
                  <option key={doc.filename} value={doc.filename}>
                    {doc.title || doc.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh / Re-extract Financials"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Upload PDF</span>
            </button>

            {/* Chatbot Toggle Button */}
            <button
              onClick={onToggleChat}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>RAG Chat</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
