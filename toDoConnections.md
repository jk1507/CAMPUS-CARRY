# CampusCarry — Setup & Connections Guide

> One place for everything you need to connect manually: database, API keys, Firebase, Razorpay, environment variables, file locations, and the order to do it all.

---

## How to Use This Guide

Follow the sections below **in order**. Each section tells you:
- **What** to connect
- **Where** the relevant file is
- **What values** you need
- **How** to get those values

---

## Table of Contents

1. [Step 0 — Project Folder Structure](#step-0--project-folder-structure)
2. [Step 1 — Create Your `.env` Files](#step-1--create-your-env-files)
3. [Step 2 — Database (MySQL)](#step-2--database-mysql)
4. [Step 3 — Start Backend](#step-3--start-backend)
5. [Step 4 — Start Frontend](#step-4--start-frontend)
6. [Step 5 — Razorpay (Payouts / Withdrawals)](#step-5--razorpay-payouts--withdrawals)
7. [Step 6 — Firebase / FCM (Push Notifications)](#step-6--firebase--fcm-push-notifications)
8. [Step 7 — Run via Docker (All-in-One)](#step-7--run-via-docker-all-in-one)
9. [Step 8 — Verify Everything Works](#step-8--verify-everything-works)
10. [Troubleshooting](#troubleshooting)

---

## Step 0 — Project Folder Structure

This is the project root layout. All paths below are relative to this folder.

```
CAMPUS-CARRY/
├── README.md                  # You're reading this guide's sibling
├── .env.example               # Template — copy to .env (root level)
├── .env                       # ← YOU CREATE THIS (root level, NOT committed)
├── .gitignore
├── docker-compose.yml         # Docker setup (optional)
├── database/
│   └── schema.sql            # Run this ONCE to create all tables
├── backend/
│   ├── .env.example          # Template — copy to .env (backend level)
│   ├── .env                  # ← YOU CREATE THIS (backend level, NOT committed)
│   ├── package.json
│   ├── server.js             # ← Entry point — starts Express + Socket.io
│   ├── db.js                 # MySQL connection pool (reads DB_* from .env)
│   ├── logger.js             # Winston logging
│   ├── jobs/
│   │   └── expireRequests.js # Cron job — auto-cancels expired requests
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validate.js       # Zod validation middleware
│   ├── sockets/
│   │   └── index.js          # Socket.io event handlers
│   ├── services/
│   │   ├── razorpay.js       # Razorpay client (reads RAZORPAY_* from .env)
│   │   └── fcm.js            # Firebase Cloud Messaging (reads FCM_* from .env)
│   ├── validators/
│   │   └── index.js          # All Zod schemas
│   └── routes/
│       ├── auth.js           # /api/auth/* (register, login, /me)
│       ├── requests.js       # /api/requests/* (feed, create, accept, cancel, status)
│       ├── location.js       # /api/location/* (update, fetch)
│       ├── feedback.js       # /api/feedback/* (submit, check, list)
│       ├── chat.js           # /api/chat/* (send, list)
│       ├── users.js          # /api/users/* (get, update profile)
│       ├── dashboard.js      # /api/dashboard/* (requester + carrier stats)
│       ├── reports.js        # /api/reports/* (submit report)
│       ├── notifications.js  # /api/notifications/* (list, mark read)
│       ├── withdrawals.js    # /api/withdrawals/* (create, list) + /api/webhooks/razorpay
│       └── fcm.js            # /api/fcm/* (register token, test, check)
└── frontend/
    ├── .env                  # ← YOU CREATE THIS (frontend level, NOT committed)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   └── firebase-messaging-sw.js   # Service worker (PLACEHOLDER — edit Firebase config)
    └── src/
        ├── main.jsx          # React entry point
        ├── App.jsx           # Routes: / , /auth , /app/*
        ├── index.css         # Tailwind + CSS variables
        ├── api/
        │   └── client.js     # Axios instance — auto-attaches JWT token
        ├── socket/
        │   └── socket.js     # Socket.io client (connects to backend:4000)
        ├── store/
        │   ├── authStore.js  # Zustand — token, user, activeRole
        │   └── requestStore.js # Zustand — feed, myRequests, carrying
        ├── hooks/
        │   └── useFCM.jsx    # FCM React hook
        ├── services/
        │   └── fcm.js        # FCM service — token registration, foreground handling
        └── components/
            ├── Sidebar.jsx
            ├── BottomNav.jsx
            ├── LiveMap.jsx
            ├── HelpPage.jsx
            ├── Feed.jsx
            ├── MyRequests.jsx
            ├── Carrying.jsx
            ├── RequestCard.jsx
            ├── RequestWizard.jsx
            ├── RequestDetailModal.jsx
            ├── Earnings.jsx
            ├── RequesterDashboard.jsx
            ├── ProfilePage.jsx
            └── WithdrawalPage.jsx   # ← new — payout UI at /app/withdraw
```

---

## Step 1 — Create Your `.env` Files

You need **two** `.env` files (both are gitignored — never committed).

### File 1: Root `.env` (project root / `CAMPUS-CARRY/.env`)

```bash
# Copy the template
cp .env.example .env
```

Then edit `.env` and fill in **at minimum**:

```ini
# ── Application ──
NODE_ENV=development

# ── Database ──
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=campuscarry

# ── Auth ──
JWT_SECRET=replace_with_a_long_random_string_min_32_chars
JWT_EXPIRES_IN=7d

# ── URLs ──
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000

# ── Ports ──
PORT=4000
FRONTEND_PORT=5173

# ── Logging ──
LOG_LEVEL=info

# ── Razorpay (optional — leave blank if you don't need payouts yet) ──
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_TEST_MODE=true

# ── FCM / Firebase (optional — leave blank if you don't need push yet) ──
FCM_SERVICE_ACCOUNT_PATH=
FCM_SERVICE_ACCOUNT=
```

> **Note:** If you leave `RAZORPAY_*` and `FCM_*` blank, the app still runs. The withdrawal feature and push notifications just won't work until you fill them in.

### File 2: Backend `.env` ( `CAMPUS-CARRY/backend/.env` )

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

```ini
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=campuscarry
JWT_SECRET=replace_with_same_long_random_string_as_root_env
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
RAZORPAY_TEST_MODE=true

# FCM
FCM_SERVICE_ACCOUNT_PATH=
FCM_SERVICE_ACCOUNT=
```

> **Important:** `JWT_SECRET` and `DB_PASSWORD` must match between root `.env` and `backend/.env`. The root `.env` is used by Docker; `backend/.env` is used when running manually. Keep them in sync.

### File 3: Frontend `.env` ( `CAMPUS-CARRY/frontend/.env` )

Create this file (no template exists — create from scratch):

```ini
VITE_API_BASE_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

> **Only `VITE_API_BASE_URL` is required.** The Firebase vars are needed only if you want push notifications.

---

## Step 2 — Database (MySQL)

### What you need
- MySQL 8.0+ installed and running on your machine
- A database user with permission to CREATE DATABASE and CREATE TABLE
- The password for that user

### What to do

**Option A — Manual (if MySQL is already installed locally)**

1. Open your MySQL client (MySQL Workbench, command line, etc.)
2. Log in as root (or a user with CREATE privileges)
3. Run the schema file:

```bash
# From the project root:
mysql -u root -p < database/schema.sql
```

Or open in MySQL Workbench and execute the whole `database/schema.sql` file.

The schema creates:
- Database: `campuscarry`
- Tables: `users`, `requests`, `locations`, `chat_messages`, `feedback`, `notifications`, `reports`, `withdrawals`
- The `users` table has a new `fcm_token` column (added in this version)

**Option B — Docker (if you don't have MySQL installed)**

The `docker-compose.yml` starts MySQL for you automatically. See [Step 7](#step-7--run-via-docker-all-in-one). The schema is auto-run via the init script mounted at `/docker-entrypoint-initdb.d/`.

### Verify the database is ready

```bash
mysql -u root -p -e "USE campuscarry; SHOW TABLES;"
```

You should see:
```
+---------------------------+
| Tables_in_campuscarry     |
+---------------------------+
| users                     |
| requests                  |
| locations                 |
| chat_messages             |
| feedback                  |
| notifications             |
| reports                   |
| withdrawals               |
+---------------------------+
```

---

## Step 3 — Start Backend

### What you need
- Node.js 18+ installed
- All environment variables set in `backend/.env` (see Step 1)
- MySQL running and the schema executed (see Step 2)

### What to do

```bash
cd backend
npm install          # install dependencies (only needed once, or after pulling new code)
npm run dev          # starts server with nodemon (auto-restart on changes)
```

The backend starts on `http://localhost:4000`.

### What to check
Open `http://localhost:4000/api/health` in your browser or run:

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{ "success": true, "data": { "status": "ok" } }
```

If you get `{"success":false,"error":"DB down"}`, check:
- MySQL is running
- `DB_PASSWORD` in `backend/.env` matches your MySQL password
- `DB_NAME` is `campuscarry` (the database created in Step 2)

### Backend environment variables (reference)

| Variable | Used by | Required? |
|---|---|---|
| `PORT` | `server.js` — which port to listen on | No (default: 4000) |
| `DB_HOST` | `db.js` — MySQL host | Yes |
| `DB_PORT` | `db.js` — MySQL port | No (default: 3306) |
| `DB_USER` | `db.js` — MySQL username | Yes |
| `DB_PASSWORD` | `db.js` — MySQL password | Yes |
| `DB_NAME` | `db.js` — database name | Yes |
| `JWT_SECRET` | `auth.js`, `sockets/index.js` — token signing/verification | Yes |
| `JWT_EXPIRES_IN` | `auth.js` — token expiry | No (default: 7d) |
| `FRONTEND_URL` | `server.js` — CORS origin + Socket.io CORS | Yes |
| `LOG_LEVEL` | `logger.js` — winston level | No (default: info) |
| `RAZORPAY_KEY_ID` | `services/razorpay.js` | For payouts only |
| `RAZORPAY_KEY_SECRET` | `services/razorpay.js` | For payouts only |
| `RAZORPAY_WEBHOOK_SECRET` | `services/razorpay.js` — webhook signature check | For payouts only |
| `RAZORPAY_TEST_MODE` | `services/razorpay.js` — use test mode | No (default: true) |
| `FCM_SERVICE_ACCOUNT_PATH` | `services/fcm.js` — Firebase creds file path | For push only |
| `FCM_SERVICE_ACCOUNT` | `services/fcm.js` — Firebase creds JSON string | For push only |

---

## Step 4 — Start Frontend

### What you need
- Node.js 18+ installed
- Backend running on `http://localhost:4000` (or change `VITE_API_BASE_URL`)
- Environment variables set in `frontend/.env` (see Step 1)

### What to do

```bash
cd frontend
npm install          # install dependencies (only needed once)
npm run dev          # starts Vite dev server
```

The frontend opens at `http://localhost:5173`.

### What to check
- Open `http://localhost:5173` in your browser
- You should see the CampusCarry landing page
- Click "Get Started" → register a requester account
- Then register a carrier account (or switch role after login)
- Post a request → check that it appears in the feed

### Frontend environment variables (reference)

| Variable | Used by | Required? |
|---|---|---|
| `VITE_API_BASE_URL` | `src/api/client.js` — Axios base URL | Yes (default: http://localhost:4000) |
| `VITE_FIREBASE_API_KEY` | `src/services/fcm.js` — Firebase init | For push only |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/services/fcm.js` — Firebase init | For push only |
| `VITE_FIREBASE_PROJECT_ID` | `src/services/fcm.js` — Firebase init | For push only |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/services/fcm.js` — Firebase init | For push only |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/services/fcm.js` — Firebase init | For push only |
| `VITE_FIREBASE_APP_ID` | `src/services/fcm.js` — Firebase init | For push only |
| `VITE_FIREBASE_VAPID_KEY` | `src/services/fcm.js` — push subscription | For push only |

> **Frontend env var rule:** Vite only exposes variables prefixed with `VITE_` to the client bundle. Variables without that prefix are ignored.

---

## Step 5 — Razorpay (Payouts / Withdrawals)

### What this enables
The withdrawal page at `/app/withdraw` lets carriers request a payout. A Razorpay order is created and a UPI payment link is generated. When the carrier completes the UPI payment, Razorpay sends a webhook to your backend which updates the withdrawal status and creates a notification.

### What you need
1. A Razorpay account — sign up free at https://razorpay.com
2. API keys from the Razorpay dashboard
3. A webhook configured in Razorpay pointing to your server

### How to get the keys

1. Go to https://dashboard.razorpay.com and sign in
2. Click your profile icon → **Settings** → **API Keys**
3. Copy the **Key ID** and **Key Secret**
4. Toggle "Test Mode" ON (for development — no real money moves)

### How to set up the webhook

1. In Razorpay dashboard → **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Webhook URL: `https://your-domain.com/api/webhooks/razorpay`
   - For local development: use a tunnel like ngrok:
     ```bash
     ngrok http 4000
     # Use the ngrok URL: https://xxxx.ngrok-free.app/api/webhooks/razorpay
     ```
4. Select events: **payout.paid**, **payout.failed**, **payout.updated**
5. Copy the **Webhook Secret** shown after saving
6. Add the webhook secret to your `.env`:
   ```ini
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### Where the keys go

In `backend/.env`:
```ini
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_TEST_MODE=true
```

In `backend/services/razorpay.js` — no changes needed. It reads from `process.env.RAZORPAY_*`.

In `backend/routes/withdrawals.js` — no changes needed. It calls `createWithdrawalIntent()` from the Razorpay service.

### Files involved
- **`backend/.env`** — store your Razorpay keys here
- **`backend/services/razorpay.js`** — Razorpay client logic (reads env, creates orders, verifies webhook signatures)
- **`backend/routes/withdrawals.js`** — withdrawal creation + webhook endpoint
- **`backend/database/schema.sql`** — `withdrawals` table (already in schema)
- **`frontend/src/components/WithdrawalPage.jsx`** — withdrawal UI
- **`frontend/src/pages/AppShell.jsx`** — route: `/app/withdraw`
- **`frontend/src/components/Sidebar.jsx`** — sidebar link: "Withdraw"

### Testing without real keys
Leave `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` **blank** in `.env`. The withdrawal page will still load, but calling the API will return a 500 error. This is fine for development — add real keys when you're ready to test payouts.

---

## Step 6 — Firebase / FCM (Push Notifications)

### What this enables
- Push notifications to users even when the app is closed
- Foreground notifications (toast) when the app is open
- Auto-subscription to a campus topic so campus-wide broadcasts work
- Service worker handles notifications when the app is in the background

### What you need
1. A Firebase project — create at https://console.firebase.google.com
2. Firebase web app config values
3. A service account key (for the backend to send push notifications)
4. Update the service worker file with your Firebase config

### How to get the keys

**Part A — Firebase project + web app config (for frontend)**

1. Go to https://console.firebase.google.com and create a project
2. Click **Add app** → choose **Web** (</> icon)
3. Register the app with any nickname (e.g., "CampusCarry Web")
4. Copy the `firebaseConfig` object shown — it contains:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
5. Enable **Cloud Messaging** in the Firebase console:
   - Go to **Project Settings** → **Cloud Messaging** tab
   - Generate a **VAPID key** (if not already generated) — this is needed for web push

**Part B — Service account key (for backend to send pushes)**

1. In Firebase console → **Project Settings** (gear icon) → **Service Accounts** tab
2. Click **Generate new private key**
3. Confirm and download the JSON file (e.g., `service-account.json`)
4. **Do not commit this file to Git** — store it securely

### Where the values go

**Frontend `.env`** (`frontend/.env`):
```ini
VITE_FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_VAPID_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Backend `.env`** (`backend/.env`):
```ini
# Option 1: point to the service account JSON file (recommended)
FCM_SERVICE_ACCOUNT_PATH=/path/to/your/service-account.json

# Option 2: paste the entire JSON as a string (less secure, not recommended)
# FCM_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Service worker** (`frontend/public/firebase-messaging-sw.js`):

Open this file and replace the `{{PLACEHOLDER}}` values with your actual Firebase config:

```javascript
firebase.initializeApp({
  apiKey:            "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abcdef123456",
});
```

> **Important:** The service worker file is served from `public/`. It must have your **actual** Firebase values, not environment variables (service workers don't have access to `import.meta.env`).

### Files involved
- **`frontend/.env`** — Firebase config for the frontend (prefixed with `VITE_`)
- **`backend/.env`** — `FCM_SERVICE_ACCOUNT_PATH` or `FCM_SERVICE_ACCOUNT`
- **`frontend/public/firebase-messaging-sw.js`** — service worker with hardcoded Firebase config
- **`frontend/src/services/fcm.js`** — FCM service: requests permission, gets token, registers with backend, handles foreground messages
- **`frontend/src/hooks/useFCM.jsx`** — React hook that initializes FCM on login
- **`frontend/src/pages/AppShell.jsx`** — uses `useFCM()` hook, shows foreground toasts
- **`backend/services/fcm.js`** — backend FCM service: sends push, broadcasts to campus, topic subscribe/unsubscribe
- **`backend/routes/fcm.js`** — FCM token registration endpoint
- **`backend/database/schema.sql`** — `fcm_token` column on `users` table (already added)

### Testing without Firebase
Leave all `VITE_FIREBASE_*` vars blank in `frontend/.env` and leave `FCM_SERVICE_ACCOUNT_PATH` blank in `backend/.env`. The app runs normally — FCM just won't initialize and you won't get push notifications. The `useFCM` hook handles this gracefully.

---

## Step 7 — Run via Docker (All-in-One)

If you have Docker + Docker Compose installed, this is the easiest way to run everything.

### What you need
- Docker Desktop (or Docker Engine + Docker Compose) installed
- The `.env` file in the project root with `DB_PASSWORD` and `JWT_SECRET` filled in

### What to do

```bash
# From the project root:
cp .env.example .env
# Edit .env → set DB_PASSWORD, JWT_SECRET at minimum

# Start everything:
docker compose up -d

# Check logs:
docker compose logs -f

# Stop everything:
docker compose down
```

### What Docker starts
| Service | Port | What it is |
|---|---|---|
| `db` | 3306 | MySQL 8.0 — auto-creates `campuscarry` DB + runs `schema.sql` |
| `backend` | 4000 | Node.js + Express + Socket.io (running `npm run dev`) |
| `frontend` | 5173 | Vite dev server (running `npm run dev -- --host 0.0.0.0`) |

### Docker environment variables
The `docker-compose.yml` reads from the **root `.env`** file. Make sure that file has:
- `DB_PASSWORD` — MySQL root password
- `JWT_SECRET` — for token signing
- `FRONTEND_URL` — must match the frontend URL (http://localhost:5173)
- `RAZORPAY_*` and `FCM_*` if you want those features in Docker

### Docker-specific notes
- MySQL data persists in a Docker volume (`db_data`) — won't be lost on `docker compose down`
- Backend logs go to a Docker volume (`backend_logs`) — access via `docker compose logs backend`
- The `schema.sql` is auto-run only when MySQL first starts with an empty data volume. To re-run it, delete the volume: `docker compose down -v` (WARNING: destroys all data)
- Backend runs in dev mode (`npm run dev` with nodemon) — code changes in `backend/` are picked up automatically via the volume mount
- Frontend runs in dev mode — code changes in `frontend/` are picked up automatically

---

## Step 8 — Verify Everything Works

After starting backend + frontend (manually or via Docker), follow this checklist:

### 1. Health check
```bash
curl http://localhost:4000/api/health
# Expected: {"success":true,"data":{"status":"ok"}}
```

### 2. Frontend loads
Open `http://localhost:5173` — you should see the CampusCarry landing page with the animated background.

### 3. Register a requester
- Click "Get Started" → choose "Register" tab
- Fill in: name, email, password, campus
- Choose "Request" role
- Click "Create Account"
- You should be redirected to `/app` (My Requests page)

### 4. Register a carrier (in a different browser or incognito)
- Go to `/auth` → choose "Register" tab
- Fill in: name, email, password, campus, phone (phone is required for carriers)
- Choose "Carry & Earn" role
- Click "Create Account"

### 5. Post a request (as requester)
- Go to `/app/new` (New Request)
- Fill in: title, pickup location, dropoff location, reward
- Click "Post Request"
- You should see a success toast and be redirected to My Requests

### 6. Accept a request (as carrier)
- Carrier goes to `/app` (Live Feed)
- They should see the request you just posted
- Click "Accept Request"
- The requester should get a toast: "🛵 [Name] accepted your request!"

### 7. Test the chat
- Open the request detail modal (click the request card)
- Go to the Chat tab
- Send a message as carrier → requester should see it
- Send a message as requester → carrier should see it

### 8. Test location sharing (as carrier)
- In the request detail modal → Location tab
- Click "Start Sharing Live Location"
- Allow browser geolocation permission
- As the requester, go to the Location tab — you should see the carrier's position on the map

### 9. Test the withdrawal flow (as carrier)
- Carrier goes to `/app/withdraw`
- Enter an amount and UPI ID
- Click "Request Withdrawal"
- **Without Razorpay keys**: you'll get a 500 error (expected — add keys to enable)
- **With Razorpay keys**: a UPI payment link is generated

### 10. Test push notifications (if FCM is configured)
- With the app open, another user accepts your request
- You should see a toast notification in the corner
- Close the app tab, have someone post a new request
- You should receive a browser push notification

---

## Troubleshooting

### Backend won't start — "MySQL failed"
- Check `backend/.env` → `DB_PASSWORD` matches your MySQL password
- Check MySQL is actually running: `mysqladmin ping` or open MySQL Workbench
- If using Docker: `docker compose ps` → `db` should show "healthy"
- If using Docker and the DB was previously started with a different password, delete the volume: `docker compose down -v` then `docker compose up -d`

### "Route not found" when clicking things in the app
- Frontend is running but can't reach the backend
- Check `frontend/.env` → `VITE_API_BASE_URL=http://localhost:4000`
- Check backend is running: `curl http://localhost:4000/api/health`
- If using Docker: make sure `FRONTEND_URL` in root `.env` is `http://localhost:5173`

### Socket.io not connecting / real-time features not working
- Check `FRONTEND_URL` in `backend/.env` matches where frontend is running
- Check browser console for Socket.io connection errors
- If using Docker: the frontend container needs to connect to `backend:4000` (Docker service name), not `localhost:4000`. The nginx proxy handles this, but the direct socket connection from the browser goes to `localhost:4000`

### WebSocket connection failed in browser console
- Port 4000 might be blocked by a firewall
- If using ngrok or a tunnel, make sure the socket connection URL matches the tunnel URL
- Check the backend logs: `docker compose logs backend` or look at the terminal where `npm run dev` is running

### "JWT secret mismatch" or tokens not working
- `JWT_SECRET` in `backend/.env` must match what was used to sign the token
- If you changed `JWT_SECRET` after users were registered, all existing tokens are invalidated — users need to log in again
- Make sure root `.env` and `backend/.env` have the same `JWT_SECRET` if using Docker

### Withdrawal returns 500
- Razorpay keys not set in `backend/.env` — add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Or leave them blank and accept that the withdrawal API will error until keys are added

### Push notifications not appearing
- Check browser permission: click the lock icon in the address bar → "Notifications" → allow
- Check `frontend/.env` has valid `VITE_FIREBASE_*` values
- Check `frontend/public/firebase-messaging-sw.js` has your actual Firebase config (not placeholders)
- Check `backend/.env` has `FCM_SERVICE_ACCOUNT_PATH` pointing to a valid service account JSON file
- Check browser console for FCM errors (e.g., "Firebase analytics is not available")
- Test in Chrome on desktop — push notifications work best there. Mobile browsers have varying support.

### Docker: frontend can't connect to backend
- The `docker-compose.yml` uses `backend:4000` as the backend hostname (Docker's internal DNS)
- The frontend dev server runs inside Docker too — so `localhost:4000` from the browser goes to the host, not the container
- Make sure `FRONTEND_URL=http://localhost:5173` in root `.env`
- Make sure `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env` (the browser sees `localhost`, and Docker publishes port 4000 to the host)

### Database schema already exists error
- If you run `schema.sql` twice, you'll get "table already exists" warnings — that's fine, `IF NOT EXISTS` handles it
- If you changed the schema (e.g., added `fcm_token` column) and the old table doesn't have it, you need to alter the table manually:
  ```sql
  ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) DEFAULT NULL;
  ```

---

## Quick Reference — All API Endpoints

| Method | Endpoint | Auth? | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get current user profile |
| GET | `/api/requests/feed` | Yes | Get open requests for campus |
| POST | `/api/requests` | Yes | Create a new request |
| GET | `/api/requests/mine` | Yes | Get requester's own requests |
| GET | `/api/requests/carrying` | Yes | Get carrier's accepted requests |
| GET | `/api/requests/:id` | Yes | Get single request details |
| PATCH | `/api/requests/:id/accept` | Yes | Accept a request (carrier) |
| PATCH | `/api/requests/:id/cancel` | Yes | Cancel a request (requester) |
| PATCH | `/api/requests/:id/status` | Yes | Update request status |
| POST | `/api/location/update` | Yes | Update user location |
| GET | `/api/location/:userId` | Yes | Get user's location |
| POST | `/api/feedback` | Yes | Submit rating + comment |
| GET | `/api/feedback/check/:requestId` | Yes | Check if user already rated |
| GET | `/api/feedback/user/:userId` | Yes | Get feedback for a user |
| POST | `/api/chat` | Yes | Save a chat message |
| GET | `/api/chat/:requestId` | Yes | Get chat messages for a request |
| GET | `/api/users/:id` | Yes | Get user profile |
| PATCH | `/api/users/me` | Yes | Update own profile |
| POST | `/api/reports` | Yes | Submit a report |
| GET | `/api/notifications` | Yes | Get user's notifications |
| PATCH | `/api/notifications/:id/read` | Yes | Mark notification as read |
| POST | `/api/withdrawals` | Yes | Create a withdrawal request (Razorpay) |
| GET | `/api/withdrawals` | Yes | Get withdrawal history |
| POST | `/api/webhooks/razorpay` | No (signed) | Razorpay webhook — updates withdrawal status |
| POST | `/api/fcm/register-token` | Yes | Register FCM token with backend |
| POST | `/api/fcm/send-test` | Yes | Send a test push to yourself |
| GET | `/api/fcm/me` | Yes | Check if FCM token is registered |
| GET | `/api/dashboard/requester` | Yes | Requester stats (weekly, monthly, yearly) |
| GET | `/api/dashboard/carrier` | Yes | Carrier stats (deliveries, earnings, rating) |
| GET | `/api/health` | No | Health check — DB connectivity |

---

## Environment Variables — Complete Summary

### Root `.env` (for Docker)
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your_mysql_password>
DB_NAME=campuscarry
JWT_SECRET=<long_random_string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000
PORT=4000
FRONTEND_PORT=5173
LOG_LEVEL=info
RAZORPAY_KEY_ID=<optional>
RAZORPAY_KEY_SECRET=<optional>
RAZORPAY_WEBHOOK_SECRET=<optional>
RAZORPAY_TEST_MODE=true
FCM_SERVICE_ACCOUNT_PATH=<optional>
FCM_SERVICE_ACCOUNT=<optional>
```

### Backend `.env` (for manual run)
```
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your_mysql_password>
DB_NAME=campuscarry
JWT_SECRET=<same_long_random_string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
RAZORPAY_KEY_ID=<optional>
RAZORPAY_KEY_SECRET=<optional>
RAZORPAY_WEBHOOK_SECRET=<optional>
RAZORPAY_TEST_MODE=true
FCM_SERVICE_ACCOUNT_PATH=<optional>
FCM_SERVICE_ACCOUNT=<optional>
```

### Frontend `.env` (for Vite)
```
VITE_API_BASE_URL=http://localhost:4000
VITE_FIREBASE_API_KEY=<optional>
VITE_FIREBASE_AUTH_DOMAIN=<optional>
VITE_FIREBASE_PROJECT_ID=<optional>
VITE_FIREBASE_STORAGE_BUCKET=<optional>
VITE_FIREBASE_MESSAGING_SENDER_ID=<optional>
VITE_FIREBASE_APP_ID=<optional>
VITE_FIREBASE_VAPID_KEY=<optional>
```

---

## Connection Order — Recommended Sequence

```
1. Install MySQL                          → System setup
2. Create database + run schema.sql       → database/schema.sql
3. Create root .env                       → copy .env.example → .env
4. Create backend .env                    → copy backend/.env.example → backend/.env
5. Start MySQL                             → Verify it's running
6. Start backend                           → cd backend && npm run dev
7. Verify backend health                   → curl localhost:4000/api/health
8. Create frontend .env                    → create frontend/.env (VITE_API_BASE_URL at minimum)
9. Start frontend                          → cd frontend && npm run dev
10. Open browser                            → localhost:5173
11. Register requester + carrier            → Test auth flow
12. Post + accept a request                 → Test full flow
13. (Optional) Add Razorpay keys           → backend/.env → test /app/withdraw
14. (Optional) Add Firebase config          → frontend/.env + firebase-messaging-sw.js → test push
15. (Optional) Set up Docker               → docker compose up -d
```

---

> **Reminder:** Never commit `.env` files. They contain your secrets. The `.gitignore` already blocks them. The `.env.example` files are safe to commit — they only contain placeholder values.
