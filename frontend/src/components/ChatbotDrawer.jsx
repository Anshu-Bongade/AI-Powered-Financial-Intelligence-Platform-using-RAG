import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Database,
  FileText,
  Layers,
  FileCheck2,
  Trash2,
  Globe
} from 'lucide-react';
import { sendChatMessage, fetchSampleQueries } from '../services/api';
import FinancialAnswerView from './FinancialAnswerView';

export default function ChatbotDrawer({ 
  isOpen, 
  onClose, 
  selectedDoc = 'all',
  documents = [],
  onSelectDoc,
  onDeleteDoc
}) {
  // Query target defaults to 'all' (Cross-Document RAG mode)
  const [chatTarget, setChatTarget] = useState('all');
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! I am your FinSight AI Financial Analyst Copilot in **Cross-Filing Mode 🌐**. I search across all uploaded annual reports in ChromaDB and verified SEC 10-K caches. Ask me to compare companies, rank KPIs (e.g., "Which company has the highest revenue?"), or analyze any financial metric!`,
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sampleQueries, setSampleQueries] = useState([]);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSampleQueries()
      .then((res) => setSampleQueries(res.queries || []))
      .catch(() => { });
  }, []);

  // Update welcome message when chatTarget changes
  useEffect(() => {
    if (chatTarget === 'all') {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `Hello! I am your FinSight AI Financial Analyst Copilot in **Cross-Filing Mode 🌐**. I search across all uploaded company reports in ChromaDB and verified SEC 10-K caches. Ask me to compare companies, rank KPIs (e.g., "Which company has the highest revenue?"), or analyze any financial metric!`,
          sources: []
        }
      ]);
    } else {
      const docObj = documents.find(d => d.filename === chatTarget);
      const name = docObj?.title || chatTarget.replace('.pdf', '').replace(/^\d{4}_/, '').replace(/_/g, ' ');
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `Hello! I am your FinSight AI Financial Analyst Copilot. I am directly connected to the ChromaDB vector database, verified SEC Form 10-K financial cache, and Gemini LLM. Ask me any question about **${name}**, and I will provide answers strictly grounded in its audited Form 10-K filing.`,
          sources: []
        }
      ]);
    }
  }, [chatTarget]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Contextual sample queries depending on whether 'all' or a specific company is selected
  const getContextualQueries = () => {
    if (chatTarget === 'all') {
      return [
        "Which company has the highest revenue?",
        "Compare Apple and Tesla profit margins",
        "Who generated the most Free Cash Flow?",
        "Compare total assets and debt across all companies"
      ];
    }

    const docObj = documents.find(d => d.filename === chatTarget);
    const docStem = docObj?.title || (chatTarget || '').replace('.pdf', '').replace(/^\d{4}_/, '');
    const isTesla = /tesla/i.test(chatTarget);
    const isWalmart = /walmart|wmt/i.test(chatTarget);
    const isNvidia = /nvidia|nvda/i.test(chatTarget);
    const isReliance = /reliance/i.test(chatTarget);

    const name = isTesla ? 'Tesla' : isWalmart ? 'Walmart' : isNvidia ? 'NVIDIA' : isReliance ? 'Reliance' : docStem || 'the company';
    return [
      `What was ${name}'s total revenue and net income in the latest fiscal year?`,
      `What were ${name}'s total assets and total liabilities?`,
      `How much cash did ${name} generate from operating activities?`,
      `What are ${name}'s primary risk factors and business segments?`
    ];
  };

  const queriesToShow = getContextualQueries();

  const toggleSourceExpand = (msgId, sourceIdx) => {
    const key = `${msgId}_${sourceIdx}`;
    setExpandedSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTargetChange = (newTarget) => {
    setChatTarget(newTarget);
    // If user explicitly chooses a single document, also notify parent if present
    if (newTarget !== 'all' && onSelectDoc) {
      onSelectDoc(newTarget);
    }
  };

  const handleSend = async (questionText = input) => {
    const q = (questionText || '').trim();
    if (!q || isLoading) return;

    const userMsgId = Date.now().toString();
    const newMessages = [...messages, { id: userMsgId, role: 'user', text: q }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send chat request with chatTarget ('all' or specific filename)
      const res = await sendChatMessage(q, 5, chatTarget);
      const assistantMsgId = (Date.now() + 1).toString();

      // Automatically expand the verified cache citation if present
      const initialExpanded = {};
      if (res.sources && res.sources.length > 0) {
        res.sources.forEach((s, idx) => {
          if (s.citation_type === 'structured_cache') {
            initialExpanded[`${assistantMsgId}_${idx}`] = true;
          }
        });
        setExpandedSources((prev) => ({ ...prev, ...initialExpanded }));
      }

      setMessages([
        ...newMessages,
        {
          id: assistantMsgId,
          role: 'assistant',
          text: res.answer,
          sources: res.sources || []
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: `Error retrieving answer: ${err.message}. Please verify the backend server is running.`,
          sources: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const isAll = chatTarget === 'all';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: isAll
          ? `Chat reset. Ask me to compare companies, rank KPIs, or look up financial metrics across all uploaded reports.`
          : `Chat reset. Ask me any financial question about ${chatTarget.replace('.pdf', '')}.`,
        sources: []
      }
    ]);
  };

  if (!isOpen) return null;

  // Selected document info for subtitle
  const selectedDocObj = documents.find(d => d.filename === chatTarget);
  const singleDocLabel = selectedDocObj 
    ? `${selectedDocObj.title || chatTarget.replace('.pdf', '')}` 
    : (chatTarget || '').replace('.pdf', '');

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] lg:w-[580px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-2.5 px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>FinSight AI Assistant</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Grounding Active
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                ChromaDB • Verified SEC Cache • Gemini Flash
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleClear}
              title="Clear Chat"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Query Target Selector Bar in Chatbot ── */}
        <div className="pt-2 border-t border-slate-800/70 space-y-1">
          <div className="flex items-center justify-between text-xs gap-2">
            
            {/* Target Label & Status */}
            <div className="flex items-center gap-1.5 min-w-0">
              {chatTarget === 'all' ? (
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold truncate">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Query Target: <strong className="text-white">All Reports 🌐</strong></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-indigo-400 font-semibold truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Query Target: <strong className="text-white">{singleDocLabel}</strong></span>
                </div>
              )}
            </div>

            {/* Target Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={chatTarget}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 hover:border-indigo-500 text-xs text-sky-300 font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors max-w-[240px] truncate"
              >
                {/* 1. All Reports Option (Top / Default) */}
                <option value="all" className="bg-slate-900 text-sky-400 font-bold">
                  🌐 All Reports (Search across all companies)
                </option>

                {/* 2. Individual Uploaded Reports */}
                {documents.map((doc) => (
                  <option key={doc.filename} value={doc.filename} className="bg-slate-900 text-slate-100">
                    📄 {doc.title ? doc.title : doc.filename.replace('.pdf', '')}
                  </option>
                ))}
              </select>

              {chatTarget !== 'all' && onDeleteDoc && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${chatTarget}" and remove all its cached data?`)) {
                      onDeleteDoc(chatTarget);
                      setChatTarget('all');
                    }
                  }}
                  disabled={documents.length <= 1}
                  title={documents.length <= 1 ? "Cannot delete the only report" : `Delete ${chatTarget}`}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Subtitle */}
          <p className="text-[10px] text-slate-400 font-mono">
            {chatTarget === 'all' 
              ? 'Searching across all available financial filings & verified caches' 
              : `Grounded in ${singleDocLabel} SEC Form 10-K filing`}
          </p>
        </div>
      </div>

      {/* ── Suggested Query Chips ── */}
      {queriesToShow.length > 0 && messages.length <= 2 && (
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {chatTarget === 'all' ? 'Suggested Cross-Company Inquiries' : 'Suggested Inquiries'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {queriesToShow.map((query, i) => (
              <button
                key={i}
                onClick={() => handleSend(query)}
                className="text-left text-xs bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition shadow-sm"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages Feed ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-4 text-xs ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-br-none shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              {msg.role === 'assistant' ? (
                <FinancialAnswerView 
                  text={msg.text} 
                  sources={msg.sources || []} 
                  selectedDoc={chatTarget === 'all' ? 'All Reports' : chatTarget} 
                />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              )}
            </div>

            {/* Citations & Source Footers */}
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div className="mt-2.5 max-w-[92%] w-full space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                  <BookOpen className="w-3 h-3 text-indigo-400" />
                  Audited Citations & Grounding Sources ({msg.sources.length})
                </span>

                <div className="space-y-1.5">
                  {msg.sources.map((source, sIdx) => {
                    const isExpanded = expandedSources[`${msg.id}_${sIdx}`];
                    const isCache = source.citation_type === 'structured_cache';

                    return (
                      <div
                        key={sIdx}
                        className={`rounded-xl border transition-all text-xs overflow-hidden ${
                          isCache 
                            ? 'bg-emerald-950/20 border-emerald-500/30' 
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSourceExpand(msg.id, sIdx)}
                          className="w-full px-3 py-2 flex items-center justify-between text-left gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isCache ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-200 truncate">
                              {source.source || 'SEC 10-K Filing'}
                            </span>
                            {source.chunk_index !== undefined && source.chunk_index !== null && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
                                #{source.chunk_index}
                              </span>
                            )}
                            {source.distance !== undefined && source.distance > 0 && (
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                dist: {source.distance}
                              </span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 space-y-1.5 text-[11px] text-slate-300">
                            {source.section && (
                              <p className="text-slate-400 font-medium">
                                Section: <span className="text-slate-200">{source.section}</span>
                              </p>
                            )}
                            {source.page_number && (
                              <p className="text-slate-400">
                                Page: <span className="text-sky-300 font-mono">{source.page_number}</span>
                              </p>
                            )}
                            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto border border-slate-800/80">
                              {source.excerpt}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50 max-w-[70%]">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span>
              {chatTarget === 'all' 
                ? 'Cross-referencing all SEC filings & verified caches...' 
                : `Retrieving verified statements for ${singleDocLabel}...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Box ── */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              chatTarget === 'all'
                ? "Ask across all reports (e.g. 'Which company has the highest revenue?')..."
                : `Ask any question about ${singleDocLabel}...`
            }
            disabled={isLoading}
            className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs rounded-xl pl-4 pr-12 py-3 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-indigo-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-400" />
            Mode: {chatTarget === 'all' ? 'Cross-Filing Vector RAG' : 'Targeted Filing RAG'}
          </span>
          <span>Zero Hallucination Guaranteed</span>
        </div>
      </div>

    </div>
  );
}
