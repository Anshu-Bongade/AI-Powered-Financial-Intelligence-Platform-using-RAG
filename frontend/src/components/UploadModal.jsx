import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Database,
  ArrowRight,
  Clock
} from 'lucide-react';
import { uploadAnnualReport } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // 0:Idle 1:Uploading 2:Extracting 3:AI 4:Done
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMessage('Please select a valid PDF file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMessage('');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadStep(1);
    setErrorMessage('');
    setElapsedSecs(0);

    // Elapsed-time ticker so the user sees progress even while the server works
    const startTime = Date.now();
    const ticker = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Dynamic step transition to reflect real stages
    const step2Timer = setTimeout(() => setUploadStep(2), 2000);
    const step3Timer = setTimeout(() => setUploadStep(3), 15000);

    try {
      const data = await uploadAnnualReport(selectedFile);

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);

      setUploadResult(data);
      setUploadStep(4); // Completed

      if (onUploadSuccess) {
        onUploadSuccess(data);  // Pass full response including data.report
      }
    } catch (err) {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      setErrorMessage(err.message || 'An error occurred during upload.');
      setUploadStep(0);
    } finally {
      clearInterval(ticker);
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setUploadStep(0);
    setErrorMessage('');
    setUploadResult(null);
    setElapsedSecs(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 border border-sky-500/20 text-sky-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Upload Annual Report (PDF)
              </h3>
              <p className="text-xs text-slate-400">
                Extract financial statements, generate embeddings, and index into ChromaDB.
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Processing State with Elapsed Time */}
        {isUploading && (
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium text-slate-200 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  Processing {selectedFile?.name}...
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {elapsedSecs}s
                </span>
              </div>

              {/* Progress Steps */}
              <div className="space-y-2 pt-1 text-xs">
                {[
                  { step: 1, label: '📤 Uploading PDF to server...' },
                  { step: 2, label: '📄 Extracting text & SEC financial statement tables...' },
                  { step: 3, label: '🤖 Gemini AI structuring balance sheet & calculating KPIs...' }
                ].map(({ step, label }) => {
                  const isActive = uploadStep === step;
                  const isDone = uploadStep > step;
                  return (
                    <div 
                      key={step}
                      className={`flex items-center gap-2 transition-colors ${
                        isActive 
                          ? 'text-sky-300 font-medium' 
                          : isDone 
                            ? 'text-emerald-400' 
                            : 'text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                      )}
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Processing multi-page 10-K filings usually takes 20–40 seconds. Please keep this tab open.
            </p>
          </div>
        )}

        {/* Success State */}
        {uploadStep === 4 && uploadResult && (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Upload & Indexing Complete!</span>
              </div>
              <p className="text-xs text-emerald-400/90 leading-relaxed">
                {uploadResult.message || `Successfully indexed ${selectedFile?.name}.`}
              </p>
              {uploadResult.total_collection_chunks && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/70 pt-1 font-mono">
                  <Database className="w-3 h-3" />
                  <span>Total ChromaDB Chunks: {uploadResult.total_collection_chunks}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Idle File Selector State */}
        {!isUploading && uploadStep !== 4 && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer bg-slate-900/40 hover:bg-slate-900/70 transition-all group">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2 group-hover:text-sky-400 group-hover:scale-110 transition-all" />
              <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                Click to browse or drag and drop SEC 10-K PDF
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports official annual filings and audited quarterly reports (max 50MB)
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
                  <span className="text-slate-500 font-mono">
                    ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetModal}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Process & Index PDF</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
