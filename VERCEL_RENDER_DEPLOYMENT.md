# 🚀 FinSight AI — Decoupled Deployment Guide
### **Frontend: Vercel** &nbsp;|&nbsp; **Backend: Render / Railway**

This guide walks you through deploying the **FastAPI backend** on **Render** (or Railway) and the **React Vite frontend** on **Vercel**.

---

## 🏗️ Architecture Overview

```text
┌─────────────────────────────────┐        ┌──────────────────────────────────┐
│      Vercel (Global Edge)       │        │     Render / Railway (Cloud)     │
│   React 19 + Vite + Tailwind    │ ──────>│   FastAPI + ChromaDB + Gemini    │
│   https://finsight-ai.vercel.app│  REST  │ https://finsight-api.onrender.com│
└─────────────────────────────────┘        └──────────────────────────────────┘
```

- **Zero CORS issues:** FastAPI backend is pre-configured with `CORSMiddleware` (`allow_origins=["*"]`).
- **Dynamic API routing:** Frontend automatically reads `VITE_API_BASE_URL` pointing to your deployed backend.

---

## 1️⃣ STEP 1: Deploy Backend on Render (or Railway)

Deploy the backend first so you have your live API URL ready for Vercel.

### Method A: Render (Free / Starter Tier)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for decoupled deployment"
   git push origin main
   ```
2. **Open Render Dashboard:**
   - Go to [dashboard.render.com](https://dashboard.render.com/).
   - Click **New +** → **Web Service**.
   - Select your GitHub repository (`RAG_TEST`).
3. **Configure the Service Settings:**
   - **Name:** `finsight-api` (or any name you choose)
   - **Language / Runtime:** `Python` (or `Docker`)
   - **Region:** Any (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Starter` (1 GB RAM minimum recommended for embeddings)
4. **Environment Variables:**
   Add these in the **Environment Variables** section:
   - `GEMINI_API_KEY`: *(paste your Google Gemini API key)*
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
5. **Click "Create Web Service"**:
   - Wait 2–3 minutes for dependencies to install.
   - Once live, copy your backend service URL:  
     `https://finsight-api.onrender.com`

---

### Method B: Railway (Alternative Backend)

1. Go to [railway.app](https://railway.app/) and click **New Project** → **Deploy from GitHub repo**.
2. In **Variables**, add:
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
3. Under **Settings** → **Networking** → Click **Generate Domain**.
4. Copy your live backend URL (e.g., `https://finsight-api.up.railway.app`).

---

## 2️⃣ STEP 2: Deploy Frontend on Vercel

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com/) and click **Add New...** → **Project**.
   - Import your GitHub repository.
2. **Configure Project Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `npm run build` (automatic)
   - **Output Directory:** `dist` (automatic)
3. **Add Environment Variable:**
   Expand the **Environment Variables** section and add:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://finsight-api.onrender.com/api`  
     *(Replace `finsight-api.onrender.com` with your actual Render / Railway backend domain, keeping the `/api` suffix)*
4. **Click "Deploy"**:
   - Vercel will build the frontend in ~30 seconds.
   - You will receive a production URL: `https://finsight-ai.vercel.app`.

---

## 3️⃣ STEP 3: Verify Live Deployment

1. **Verify Backend Health:**
   Visit in your browser:
   `https://finsight-api.onrender.com/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "gemini_model": "gemini-3.5-flash-lite",
     "chroma_chunks_count": 1547,
     "available_reports_count": 5
   }
   ```
2. **Verify Frontend:**
   Open your Vercel URL (`https://your-app.vercel.app`):
   - Check that Apple, Tesla, Walmart, NVIDIA, and Reliance appear in the document selector.
   - Navigate to **Compare Companies** and test side-by-side comparison.
   - Click **Ask AI Copilot**, set query target to **🌐 All Reports**, and ask *"Which company has the highest revenue?"*.

---

## 🛠️ Summary of Files Created for Deployment

| File | Purpose |
|---|---|
| [`frontend/vercel.json`](file:///c:/Users/anshu/OneDrive/Desktop/RAG_TEST/frontend/vercel.json) | Configures SPA rewrites for Vercel edge routing |
| [`frontend/src/services/api.js`](file:///c:/Users/anshu/OneDrive/Desktop/RAG_TEST/frontend/src/services/api.js) | Configured with dynamic `VITE_API_BASE_URL` fallback |
| [`requirements.txt`](file:///c:/Users/anshu/OneDrive/Desktop/RAG_TEST/requirements.txt) | Pinned Python production dependencies |
| [`render.yaml`](file:///c:/Users/anshu/OneDrive/Desktop/RAG_TEST/render.yaml) | Render Infrastructure as Code configuration |
| [`Dockerfile`](file:///c:/Users/anshu/OneDrive/Desktop/RAG_TEST/Dockerfile) | Production container fallback |
| [`.env.example`](file:///c:/Users/anshu/OneDrive/Desktop/RAG_TEST/.env.example) | Environment variable template |
