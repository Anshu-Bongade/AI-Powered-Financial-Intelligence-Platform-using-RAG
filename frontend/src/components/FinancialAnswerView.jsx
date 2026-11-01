import React from 'react';
import { 
  Building2, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  TrendingUp, 
  Info,
  DollarSign,
  ArrowRight
} from 'lucide-react';

/**
 * Format inline text: bold, code, percentages, currency, LaTeX clean-up
 */
function renderInlineText(text) {
  if (!text) return null;

  // Clean raw LaTeX like \+2.02\% or \$7,153 or \text{...}
  let cleaned = text
    .replace(/\\\$/g, '$')
    .replace(/\\\%/g, '%')
    .replace(/\\\+/g, '+')
    .replace(/\\-/g, '-')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1'); // Unwrap simple $math$ delimiters

  // Tokenize for bold (**text**), code (`text`), and italic (*text*)
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: cleaned.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      tokens.push({ type: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      tokens.push({ type: 'code', value: raw.slice(1, -1) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      tokens.push({ type: 'italic', value: raw.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < cleaned.length) {
    tokens.push({ type: 'text', value: cleaned.slice(lastIndex) });
  }

  return tokens.map((token, i) => {
    if (token.type === 'bold') {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {token.value}
        </strong>
      );
    }
    if (token.type === 'code') {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-300 font-mono text-[11px]">
          {token.value}
        </code>
      );
    }
    if (token.type === 'italic') {
      return <em key={i} className="italic text-slate-300">{token.value}</em>;
    }
    return token.value;
  });
}

/**
 * Clean markdown table cell
 */
function renderTableCell(cellText, isHeader = false) {
  const content = renderInlineText(cellText.trim());
  if (isHeader) {
    return (
      <th className="px-3.5 py-2.5 text-left text-[11px] font-bold text-slate-200 uppercase tracking-wider bg-slate-950/80 border-b border-slate-700/80">
        {content}
      </th>
    );
  }

  // Check if cell is a financial number or percentage for right-alignment styling
  const trimmed = cellText.trim();
  const isNumber = /^[\$€£]?\s*[\(\-]?\d{1,3}(,\d{3})*(\.\d+)?[\)]?%?$/.test(trimmed) || /^\+?\-?\d+(\.\d+)?%$/.test(trimmed);

  return (
    <td className={`px-3.5 py-2 text-[11px] border-b border-slate-800/60 ${isNumber ? 'font-mono text-right text-emerald-300 font-semibold' : 'text-slate-300'}`}>
      {content}
    </td>
  );
}

/**
 * Checks if a response represents an unavailable metric/year or abstention
 */
function detectUnavailableNotice(text) {
  const lower = text.toLowerCase();
  const patterns = [
    'could not be determined',
    'not available in the uploaded',
    'not reported in the provided',
    'information was unavailable',
    'does not provide that figure',
    'future year',
    'cannot determine',
    'abstain'
  ];
  return patterns.some(p => lower.includes(p));
}

/**
 * Detects if the response starts with a prominent single-metric callout
 * like:
 * Net Income — FY2024
 * $93,736 million
 */
function extractProminentMetric(text) {
  // Pattern 1: e.g. "Apple's net income in fiscal year 2024 was **$93,736 million**"
  // or a markdown header: "# $93,736 million" or "**$93,736 million**"
  const metricMatch = text.match(/(?:was|is|reported at|amounted to)\s+(\$[\d,]+(?:\.\d+)?\s*(?:million|billion)?)/i) ||
                      text.match(/^#+\s*(\$[\d,]+(?:\.\d+)?\s*(?:million|billion)?)/m) ||
                      text.match(/\*\*(\$[\d,]+(?:\.\d+)?\s*(?:million|billion)?)\*\*/);
  return metricMatch ? metricMatch[1] : null;
}

/**
 * Main Structured Answer Presenter Component
 */
export default function FinancialAnswerView({ text, sources = [], selectedDoc = '' }) {
  if (!text) return null;

  const isUnavailable = detectUnavailableNotice(text);

  // If the answer is an official abstention / unavailable notice
  if (isUnavailable) {
    return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-amber-300 uppercase tracking-wide text-[10px]">
              Information Verification Notice
            </span>
            <div className="text-slate-300 leading-relaxed">
              {renderInlineText(text)}
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              FinSight AI strictly adheres to zero-hallucination rules and will not estimate figures outside audited filings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse lines into blocks: headings, tables, bullet lists, blockquotes, paragraphs
  const lines = text.split('\n');
  const blocks = [];
  let currentTable = null;
  let currentList = null;

  const flushCurrent = () => {
    if (currentTable) {
      blocks.push({ type: 'table', rows: currentTable });
      currentTable = null;
    }
    if (currentList) {
      blocks.push({ type: 'list', items: currentList });
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown Table Row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (currentList) flushCurrent();
      const cells = trimmed.slice(1, -1).split('|');
      // Skip delimiter row like |---|---|
      const isDelimiter = cells.every(c => /^[\s\-:]+$/.test(c));
      if (!isDelimiter) {
        if (!currentTable) currentTable = [];
        currentTable.push(cells);
      }
      continue;
    } else if (currentTable) {
      flushCurrent();
    }

    // Markdown Heading: #, ##, ###
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushCurrent();
      const level = headingMatch[1].length;
      blocks.push({ type: 'heading', level, text: headingMatch[2] });
      continue;
    }

    // Unordered List item
    const listMatch = trimmed.match(/^[\*\-•]\s+(.+)$/);
    if (listMatch) {
      if (!currentList) currentList = [];
      currentList.push(listMatch[1]);
      continue;
    }

    // Ordered List item
    const numListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numListMatch) {
      if (!currentList) currentList = [];
      currentList.push(numListMatch[1]);
      continue;
    }

    // Empty line or paragraph break
    if (trimmed === '') {
      flushCurrent();
      continue;
    }

    // Regular text paragraph
    if (currentList) flushCurrent();
    blocks.push({ type: 'paragraph', text: trimmed });
  }
  flushCurrent();

  // Check if we have a verified structured cache source to surface at the top
  const verifiedSource = sources.find(s => s.citation_type === 'structured_cache');
  const prominentFigure = extractProminentMetric(text);

  return (
    <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed font-sans">
      {/* Prominent Financial Stat Hero (if exact figure detected and verified) */}
      {verifiedSource && prominentFigure && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 border border-emerald-500/40 shadow-sm shadow-emerald-500/5">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Financial Fact
            </span>
            <span className="text-slate-400 font-mono">
              {verifiedSource.section ? verifiedSource.section.split(',')[0] : 'Form 10-K'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black text-white tracking-tight font-mono">
              {prominentFigure}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
            <span>Source: <strong className="text-slate-200">{verifiedSource.source || selectedDoc}</strong></span>
            {verifiedSource.page_number && (
              <>
                <span>•</span>
                <span className="text-sky-400 font-mono">Page {verifiedSource.page_number}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Render Parsed Blocks */}
      <div className="space-y-2.5">
        {blocks.map((block, idx) => {
          if (block.type === 'heading') {
            const hStyles = {
              1: 'text-sm font-black text-white pt-2 border-b border-slate-800 pb-1',
              2: 'text-xs font-bold text-white pt-1.5 text-indigo-300',
              3: 'text-xs font-bold text-slate-200 pt-1',
              4: 'text-[11px] font-semibold text-slate-300'
            };
            return (
              <div key={idx} className={hStyles[block.level] || hStyles[3]}>
                {renderInlineText(block.text)}
              </div>
            );
          }

          if (block.type === 'table') {
            const [headerRow, ...bodyRows] = block.rows;
            return (
              <div key={idx} className="my-2.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        {headerRow.map((cell, cIdx) => (
                          <React.Fragment key={cIdx}>
                            {renderTableCell(cell, true)}
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bodyRows.map((row, rIdx) => (
                        <tr 
                          key={rIdx} 
                          className="hover:bg-slate-900/60 transition-colors even:bg-slate-900/30"
                        >
                          {row.map((cell, cIdx) => (
                            <React.Fragment key={cIdx}>
                              {renderTableCell(cell, false)}
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }

          if (block.type === 'list') {
            return (
              <ul key={idx} className="space-y-1.5 my-1.5 pl-1">
                {block.items.map((item, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2 text-slate-300 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <div className="leading-relaxed flex-1">
                      {renderInlineText(item)}
                    </div>
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={idx} className="leading-relaxed text-slate-300">
              {renderInlineText(block.text)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

