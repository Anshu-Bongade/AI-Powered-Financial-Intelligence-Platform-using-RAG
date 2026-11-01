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

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Step 2 — server starts PDF extraction immediately after file is received
      setUploadStep(2);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      // Step 3 — while waiting for the JSON body, signal that AI extraction is running
      setUploadStep(3);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();

      setUploadResult(data);
      setUploadStep(4); // Completed

      if (onUploadSuccess) {
        onUploadSuccess(data);  // Pass full response including data.report
      }
    } catch (err) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-700/80 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={resetModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Upload Annual Report (PDF)
            </h3>
            <p className="text-xs text-slate-400">
              Extract financial statements, generate embeddings, and index into ChromaDB.
            </p>
          </div>
        </div>

        {/* Step Progress Display */}
        {uploadStep > 0 && uploadStep < 4 && (
          <div className="my-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            {/* Step labels */}
            <div className="space-y-2 text-xs">
              {[
                { step: 1, label: '📤 Uploading PDF to server...' },
                { step: 2, label: '📄 Extracting text & tables via PyMuPDF4LLM...' },
                { step: 3, label: '🤖 Gemini AI extracting financial statements...' },
              ].map(({ step, label }) => (
                <div key={step} className={`flex items-center gap-2 ${uploadStep >= step ? 'text-indigo-300 font-medium' : 'text-slate-600'}`}>
                  {uploadStep > step
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    : uploadStep === step
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 flex-shrink-0" />
                    : <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                  }
                  <span>{label}</span>
                  {uploadStep === step && step >= 2 && (
                    <span className="ml-auto text-slate-500 font-mono text-[11px]">
                      {elapsedSecs}s elapsed…
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-700"
                style={{ width: `${(uploadStep / 3) * 100}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Processing large 10-K reports takes 60–120 seconds. Please don't close this window.
            </p>
          </div>
        )}

        {/* Success State */}
        {uploadStep === 4 && uploadResult && (
          <div className="my-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Document Successfully Processed & Indexed!
            </div>
            <p className="text-slate-300">
              <strong className="text-white">{uploadResult.report?.source_document || selectedFile?.name}</strong> —{' '}
              <strong className="text-emerald-400 font-mono">{uploadResult.report?.company_name || 'Report'}</strong> financial data extracted and indexed into ChromaDB.
            </p>
            <p className="text-slate-400">
              Dashboard has been updated with the new report's financial statements, KPIs, and charts.
            </p>
            <div className="pt-2">
              <button
                onClick={resetModal}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Financial Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* File Dropzone Area */}
        {uploadStep === 0 && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all p-4 text-center">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                Click to browse or drag and drop SEC 10-K PDF
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
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
