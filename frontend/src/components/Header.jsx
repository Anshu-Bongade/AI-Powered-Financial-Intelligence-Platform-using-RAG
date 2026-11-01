import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  Trash2,
  Scale,
  ChevronDown
} from 'lucide-react';

export default function Header({ 
  metadata, 
  systemStatus, 
  activeTab, 
  setActiveTab, 
  onOpenUpload, 
  onToggleChat,
  isChatOpen,
  chromaChunks,
  documents = [],
  selectedDoc,
  onSelectDoc,
  onDeleteDoc
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedDoc) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedDoc}"?\nThis will remove the PDF, extracted markdown, cache, and vector embeddings.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      if (onDeleteDoc) {
        await onDeleteDoc(selectedDoc);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-18">
          
          {/* ── Left Section: Logo & Company Selector ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Logo Badge */}
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-[1px] shadow-md shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
            </div>

            {/* Title, Badge & Company / Filing Info */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  FinSight AI
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold tracking-normal">
                    RAG
                  </span>
                </span>
                
                <span className="text-slate-600 font-light">/</span>

                {/* Company Dropdown / Name */}
                {documents && documents.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center">
                      <select
                        value={selectedDoc || ''}
                        onChange={(e) => onSelectDoc && onSelectDoc(e.target.value)}
                        className="appearance-none bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs text-white rounded-lg pl-2.5 pr-6 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
                      >
                        {documents.map((doc) => (
                          <option key={doc.filename} value={doc.filename} className="bg-slate-900 text-white">
                            {doc.title || doc.filename}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                    </div>

                    {/* Delete Document Button (if > 1 document) */}
                    {documents.length > 1 && (
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        aria-label={`Delete ${selectedDoc}`}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {metadata?.company_name || 'Apple Inc.'} 
                    {metadata?.ticker && (
                      <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1 py-0.2 rounded border border-sky-500/20 font-mono">
                        {metadata.ticker}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Sub-label: Form 10-K & Audited SEC Filing */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap mt-0.5">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  {metadata?.filing_type || 'Form 10-K'} · {metadata?.fiscal_period || 'FY 2024'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Audited SEC Filing
                </span>
              </div>
            </div>
          </div>

          {/* ── Center Navigation: ONE Unified Navigation Group ── */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 overflow-x-auto shrink min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              KPI & Charts
            </button>
            <button
              onClick={() => setActiveTab('statements')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'statements'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Financial Statements
            </button>
            <button
              onClick={() => setActiveTab('ratios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'ratios'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Analytics & Ratios
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Companies</span>
            </button>
          </nav>

          {/* ── Right Actions: Compact & Single-Line ── */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Upload Annual Report Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all shadow-sm whitespace-nowrap"
            >
              <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Upload Report</span>
            </button>

            {/* Ask AI Copilot Toggle Button */}
            <button
              onClick={onToggleChat}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-md whitespace-nowrap ${
                isChatOpen
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-indigo-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>Ask AI Copilot</span>
              {isChatOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 ml-0.5"></span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
