# Zipp ⚡
> Campus errands, moved in minutes. Fast, peer-to-peer student delivery platform.

## Overview
**Zipp** connects students who need something delivered across campus with peers already walking that direction. Built mobile-first (360px–430px) with responsive desktop support, live radar mapping, walking directions, and real-time chat with photo proofs and 4-digit handover OTPs.

## Tech Stack
| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Zustand, Lucide React |
| **Backend** | Node.js, Express, Socket.io, JWT, Bcrypt, Winston |
| **Database** | MySQL / PostgreSQL / Cloud Aiven Database |
| **Maps & GPS** | Leaflet.js, OpenStreetMap, OSRM Walking Engine, Web Geolocation |

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
# -> Server running on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# -> Zipp app running on http://localhost:5173
```

---

## Design System & Features
- **Mobile-First UX**: Designed for standard phone viewports (360–430px) with bottom tab bar navigation and responsive desktop rails (≥768px).
- **Zipp Identity**: Warm off-white light theme with refined dark mode, Plus Jakarta Sans typography, and semantic status color tokens.
- **Requester Flow**: Multi-step interactive errand wizard, smart dynamic price estimator, live status tracking, and 4-digit completion OTP.
- **Carrier Flow**: Live campus feed, instant accept, turn-by-turn Google Maps routing, wallet balance and UPI instant withdrawals.
- **Safety**: 4-digit handover OTP protection, delivery photo proof uploads, and campus peer dispute reporting.
