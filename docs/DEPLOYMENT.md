# METRIX-R76: Deployment & Operations Guide

---

## 1. Prerequisites

- **Node.js**: v18+ (tested on Node v22.14.0)
- **MySQL Server**: 8.0+
- **Docker & Docker Compose** (Optional for containerized deployment)

---

## 2. Local Setup & Execution

### Step 1: Database Setup
1. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```
2. Execute the full DDL schema and seed dataset:
   ```bash
   mysql -u root -p < database/schema/full.sql
   mysql -u root -p < database/seeds/seed.sql
   ```

### Step 2: Backend Configuration & Start
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Verify or edit `.env`:
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=YourPassword
   DB_NAME=metrix_r76
   JWT_SECRET=METRIX_R76_DOCA_SECRET_KEY_2026_LEGAL_METROLOGY_COMPLIANCE
   ```
3. Run tests and start the server:
   ```bash
   npm test
   node src/server.js
   ```
   Backend listens at `http://localhost:5000`.

### Step 3: Frontend Start
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:5173`.

---

## 3. Docker Deployment

To launch the complete stack with MySQL 8.0, Node backend, and Nginx frontend in isolated containers:

```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MySQL: `localhost:3306`
