// Normalize backend base URL from environment
let rawBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
if (rawBase.endsWith('/')) rawBase = rawBase.slice(0, -1);

export const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

/**
 * Robust JSON response handler that detects HTML error pages (e.g. 404 from Vercel)
 * and produces informative error messages instead of "Unexpected token <".
 */
async function handleResponse(res, defaultError = 'Request failed') {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.includes('<!doctype') || text.includes('<html')) {
      throw new Error(
        'Backend API not connected. Please deploy the FastAPI backend on Render / Railway and set VITE_API_BASE_URL in your Vercel Project Settings to your live backend URL (e.g., https://your-backend.onrender.com).'
      );
    }
    throw new Error(`Server returned non-JSON response: ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: defaultError }));
    throw new Error(errorData.detail || errorData.message || defaultError);
  }

  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res, 'Backend health check failed');
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  return handleResponse(res, 'Failed to fetch documents');
}

export async function fetchFinancials(docName = 'Apple.pdf', forceRefresh = false) {
  const params = new URLSearchParams({ doc_name: docName, force_refresh: forceRefresh });
  const res = await fetch(`${API_BASE}/financials?${params.toString()}`);
  return handleResponse(res, 'Failed to load financials');
}

export async function uploadAnnualReport(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(res, 'Upload failed');
}

export async function sendChatMessage(question, topK = 5, docFilter = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK, doc_filter: docFilter }),
  });

  return handleResponse(res, 'Chat query failed');
}

export async function fetchSampleQueries() {
  const res = await fetch(`${API_BASE}/sample-queries`);
  return handleResponse(res, 'Failed to load sample queries');
}

export async function fetchAvailableCompanies() {
  const res = await fetch(`${API_BASE}/companies`);
  return handleResponse(res, 'Failed to fetch available companies');
}

export async function compareCompaniesAPI(companyIds) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companies: companyIds }),
  });
  return handleResponse(res, 'Failed to generate company comparison');
}
