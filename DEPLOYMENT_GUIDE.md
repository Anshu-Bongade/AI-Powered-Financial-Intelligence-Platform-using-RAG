# 🚀 FinSight AI — Production Deployment Guide

FinSight AI is a full-stack financial analytics and multi-document RAG platform (FastAPI + ChromaDB + PyMuPDF4LLM + Gemini + React Vite).

The repository has been pre-configured with:
- **`Dockerfile`**: Production-ready multi-stage container (builds Vite frontend + runs lightweight CPU-optimized Python FastAPI backend).
- **`docker-compose.yml`**: One-command local or VPS orchestration with volume persistence.
- **`render.yaml`**: One-click infrastructure blueprint for Render.
- **`requirements.txt`**: Pinned, verified production dependencies.
- **Unified Single-Port Serving**: In production, FastAPI automatically serves the built React frontend (`frontend/dist`) and API routes (`/api/*`) on the same port, eliminating CORS issues.

---

## 📋 Required Environment Variables

Before deploying, ensure you have your Google Gemini API key:

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** | — | Google Gemini API key from [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_MODEL` | No | `gemini-3.5-flash-lite` | Model identifier for extraction and grounding |
| `PORT` | No | `8000` | Port for the web service (assigned automatically by Render, Railway, Cloud Run) |

---

## 🌟 Option 1: Render (Recommended — Simplest 1-Click Cloud Deployment)

Render natively supports our `Dockerfile` and `render.yaml` blueprint.

### Steps:
1. **Push your code to GitHub / GitLab:**
   ```bash
   git add .
   git commit -m "Configure production deployment"
   git push origin main
   ```
2. **Open Render Dashboard:**
   - Go to [dashboard.render.com](https://dashboard.render.com/).
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository.
3. **Configure the Service:**
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** `Starter` (recommended: at least 1GB - 2GB RAM for sentence-transformers and embeddings)
4. **Add Environment Variables:**
   - `GEMINI_API_KEY`: *(paste your Gemini API key)*
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
5. **Add Persistent Disk (Optional but recommended for user PDF uploads):**
   - In Render service settings → **Disks** → **Add Disk**:
     - Name: `finsight-data`
     - Mount Path: `/app/data`
     - Size: `5 GB`
6. Click **Deploy Web Service**! Render will build the React frontend, install dependencies, and launch your live application at `https://your-app-name.onrender.com`.

---

## 🚂 Option 2: Railway

Railway automatically detects the `Dockerfile` and configures HTTPS and domain routing.

### Steps:
1. Install Railway CLI or connect via [railway.app](https://railway.app/):
   ```bash
   npm i -g @railway/cli
   railway login
   railway init
   ```
2. **Set Environment Variables:**
   - Go to **Variables** in your Railway project dashboard.
   - Add `GEMINI_API_KEY` = `your_gemini_api_key`.
3. **Deploy:**
   ```bash
   railway up
   ```
   Or connect your GitHub repository and Railway will deploy automatically on push.
4. **Generate Domain:** Under Service Settings → **Networking** → Click **Generate Domain**.

---

## ☁️ Option 3: Google Cloud Run (Serverless & Scalable)

Google Cloud Run provides serverless container deployment with scale-to-zero when idle.

### Steps:
1. **Build and submit image to Google Artifact Registry / Container Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/finsight-ai
   ```
2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy finsight-ai \
     --image gcr.io/YOUR_PROJECT_ID/finsight-ai \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --set-env-vars GEMINI_API_KEY="your_gemini_api_key",GEMINI_MODEL="gemini-3.5-flash-lite"
   ```

---

## 🖥️ Option 4: Self-Hosted VPS / AWS EC2 / DigitalOcean (Docker Compose)

For running on an Ubuntu / Debian VPS with persistent storage and Docker installed:

1. **Clone repository onto the server:**
   ```bash
   git clone https://github.com/your-username/RAG_TEST.git finsight-ai
   cd finsight-ai
   ```
2. **Create production `.env` file:**
   ```bash
   cp .env.example .env
   nano .env
   # Add your GEMINI_API_KEY=...
   ```
3. **Build and launch with Docker Compose:**
   ```bash
   docker compose up -d --build
   ```
4. **Verify container status:**
   ```bash
   docker compose ps
   curl http://localhost:8000/api/health
   ```
5. *(Optional)* Set up an **Nginx reverse proxy** with Certbot for SSL/HTTPS (`https://yourdomain.com`).

---

## ⚡ Option 5: Decoupled Deployment (Vercel Frontend + Render Backend)

If you prefer hosting the React static frontend on **Vercel** or **Netlify**:

### 1. Deploy Backend (FastAPI):
Deploy the backend on Render/Railway as a Python service:
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Note your live backend URL (e.g. `https://finsight-backend.onrender.com`).

### 2. Deploy Frontend (Vercel):
- In the Vercel dashboard, import the repository and set the **Root Directory** to `frontend`.
- Add an Environment Variable in Vercel:
  - `VITE_API_BASE_URL` = `https://finsight-backend.onrender.com/api`
- Click **Deploy**. Vercel will build and deploy the React application on a global edge CDN.

---

## ✅ Post-Deployment Health Check

Once deployed, verify that all systems are operational:

1. **API Health Endpoint:**
   ```bash
   curl https://your-deployment-url/api/health
   # Expected: {"status":"healthy","gemini_model":"gemini-3.5-flash-lite","chroma_chunks_count":1547,"available_reports_count":5,...}
   ```
2. **Cached Companies Endpoint:**
   ```bash
   curl https://your-deployment-url/api/companies
   # Expected: lists Apple, Tesla, Walmart, NVIDIA, Reliance
   ```
3. **Frontend Access:**
   Visit `https://your-deployment-url/` in any browser to use the single-company dashboard, multi-company comparison, and AI RAG copilot.
