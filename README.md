# CampusCarry 🛵
> Peer-to-peer campus delivery platform — Forgot something? We've got it.

## Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind + Framer Motion + Zustand |
| Backend | Node.js + Express + Socket.io + JWT + Bcrypt + Winston |
| Database | MySQL 8 |
| Maps | OpenStreetMap via Leaflet.js (no API key needed) |
| 3D Map | Three.js |

## Quick Start

### Step 1 — MySQL Setup
Open MySQL Command Line Client and run:
```sql
source C:/path/to/campuscarry/database/schema.sql
```

### Option A — Docker (recommended)
```bash
cd cc
cp .env.example .env
# Edit .env: set DB_PASSWORD, JWT_SECRET, and optionally RAZORPAY_* keys
docker compose up -d
# → backend on http://localhost:4000
# → frontend on http://localhost:5173
```

### Option B — Manual
#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set DB_PASSWORD, JWT_SECRET, RAZORPAY_* keys
npm install
npm run dev
# → running on http://localhost:4000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# → open http://localhost:5173
```

## Environment Variables (backend/.env)
```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=campuscarry
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Features
- ⚡ Real-time delivery feed (Socket.io)
- 📍 Live GPS tracking on OpenStreetMap
- 💬 Persistent in-app chat
- 🛵 Role-based UI (requester / carrier)
- ⭐ Mutual rating system
- 📊 Earnings & spending dashboards with bar charts
- 🗺 Interactive 3D campus map (Three.js)
- 🆘 Help & complaint reporting
- 🔐 JWT auth + Bcrypt passwords
- 💸 Razorpay-powered UPI payout withdrawals
- 🔔 Firebase Cloud Messaging (FCM) push notifications
- ✅ Zod validation on all backend routes
- 🐳 Docker + docker-compose (MySQL + backend + frontend)
- 🛡️ Helmet + rate limiting + CSRF-ready middleware
