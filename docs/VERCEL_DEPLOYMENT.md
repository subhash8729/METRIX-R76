# Vercel Deployment Guide — METRIX-R76

This guide provides step-by-step instructions to deploy **METRIX-R76** on [Vercel](https://vercel.com/) for high availability, global Edge CDN distribution, automatic SSL, and continuous integration.

---

## 🏗️ Architecture Overview

For a production-grade legal metrology system with MySQL 8.0:

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Edge Network                  │
│  React 18 + Vite SPA (Client Routing + Static Assets)   │
│  URL: https://metrix-r76.vercel.app                    │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS API Calls (Bearer JWT)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Backend API Service                      │
│     (Railway / Render / AWS EC2 / Docker / VPS)        │
│   Node.js + Express + OIML R-76 Rule Engine            │
│   URL: https://api.metrix-r76.your-domain.com          │
└──────────────────────────┬─────────────────────────────┘
                           │ MySQL Protocol (Port 3306)
                           ▼
┌────────────────────────────────────────────────────────┐
│               MySQL 8.0 Cloud Database                 │
│      (Aiven / Railway MySQL / TiDB / AWS RDS)          │
│   19 Normalized Tables + Immutable Audit Trail         │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Pre-Configurations Included

The repository has been pre-configured with the following files:
1. **`.gitignore`**: Excludes `node_modules/`, local `.env` files, build outputs (`dist/`), and uploaded evidence.
2. **`vercel.json` (Root)**: Configured with `buildCommand: "npm run build --prefix frontend"` and SPA client-side routing fallback so deep routes (e.g., `/instruments/1`, `/reports`, `/projects/new`) do not return 404 on refresh.
3. **`frontend/vercel.json`**: For deployments where the Vercel Root Directory is set directly to `frontend`.
4. **`frontend/.env.example`**: Documents the `VITE_API_URL` environment variable.
5. **`backend/.env.example`**: Documents cloud database connection parameters.

---

## 🚀 Step-by-Step Vercel Deployment

### Method 1: Deploy via Vercel Web Dashboard (Recommended)

#### Step 1: Push Code to GitHub
Ensure your repository is pushed to GitHub:
```bash
git add .
git commit -m "feat: complete METRIX-R76 system with Vercel deployment support"
git push origin master
```

#### Step 2: Import Project in Vercel
1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **"Add New..."** → **"Project"**.
3. Locate and click **"Import"** next to your `metrix-r76` (or `SIH-2026`) repository.

#### Step 3: Configure Project Settings
In the Vercel Project Configuration screen:

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Detected automatically |
| **Root Directory** | `frontend` *(or leave blank `./`)* | If set to `frontend`, Vercel builds directly from the frontend directory |
| **Build Command** | `npm run build` | Handled by Vite |
| **Output Directory** | `dist` | Generated HTML, JS, CSS |
| **Install Command** | `npm install` | Installs dependencies |

#### Step 4: Configure Environment Variables
Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-domain.com/api` | The HTTPS URL of your deployed Express backend API |

> **Note:** If you are testing the UI in standalone mode or using Vercel Rewrites, you can leave `VITE_API_URL` blank, and requests will default to `/api`.

#### Step 5: Click Deploy
Click **"Deploy"**. Vercel will build the frontend and provide your live production URL (e.g., `https://metrix-r76.vercel.app`).

---

### Method 2: Deploy via Vercel CLI

You can also deploy directly from your local terminal using the Vercel CLI:

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Log in to Vercel
vercel login

# 3. Deploy frontend to preview
cd frontend
vercel

# 4. Deploy frontend directly to production
vercel --prod
```

During prompts:
- *Set up and deploy?* **Yes**
- *Which scope?* **Your account**
- *Link to existing project?* **No**
- *What's your project's name?* **metrix-r76**
- *In which directory is your code located?* **./** (when run inside `frontend`)
- *Want to modify settings?* **No**

---

## 🗄️ Setting Up the Cloud MySQL Database & Backend

To connect the Vercel frontend to a live cloud backend:

### 1. Provision a Cloud MySQL 8.0 Instance
You can use any cloud MySQL provider:
- **[Aiven](https://aiven.io/)** (Free tier available)
- **[Railway](https://railway.app/)** (One-click MySQL provision)
- **[TiDB Cloud](https://tidbcloud.com/)** (MySQL-compatible Serverless tier)
- **[AWS RDS / DigitalOcean / Linode]**

Execute the initialization scripts:
```bash
# Apply schema
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < database/schema/full.sql

# Seed initial regulatory data, users, and rule versions
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < database/seeds/seed.sql
```

### 2. Deploy Backend (Railway / Render / Docker)
Deploy the `backend` folder to a Node.js host (e.g. Railway or Render):
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`
- **Environment Variables:**
  ```env
  PORT=5000
  NODE_ENV=production
  DB_HOST=<your-cloud-db-host>
  DB_PORT=3306
  DB_USER=<your-db-user>
  DB_PASSWORD=<your-db-password>
  DB_NAME=metrix_r76
  JWT_SECRET=METRIX_R76_DOCA_SECRET_KEY_2026_LEGAL_METROLOGY_COMPLIANCE
  CORS_ORIGIN=*
  ```

Copy the backend HTTPS URL (e.g., `https://metrix-api.up.railway.app`) and set it as `VITE_API_URL=https://metrix-api.up.railway.app/api` in your Vercel project settings.

---

## 🔍 Verification & Testing on Vercel

Once deployed, verify the following checklist:

1. **SPA Route Refresh:** Navigate to `/instruments`, `/test-projects`, `/rules`, and `/reports`. Refresh the page in your browser. Verify you do **not** get a 404 error (handled by `vercel.json` rewrites).
2. **Demo Persona Switching:** Use the top header bar to switch between `ADMIN`, `LAB_OFFICER`, `REVIEWER`, `APPROVER`, and `VIEWER`.
3. **Observation Entry & Calculation:** Navigate to an active test project, enter load values and $\Delta L$ turning points, and verify real-time $mpe$ calculation.
4. **Report Downloads:** Open the Report Repository and verify instant downloading of signed PDF and DOCX reports.

---

## 🛠️ Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **404 Not Found on Route Refresh** | Missing SPA rewrite rules | Ensure `vercel.json` contains `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`. |
| **CORS Network Error** | Backend does not allow Vercel origin | In your backend environment variables, set `CORS_ORIGIN=*` or specify your exact Vercel domain. |
| **Mixed Content Warning** | Frontend is HTTPS, but backend URL is HTTP | Ensure your backend uses an `https://` URL. Cloud hosts like Railway and Render provide automatic HTTPS. |
| **API Returns 401 Unauthorized** | Token missing or expired | Re-authenticate using the 1-click persona switcher on the header. |
