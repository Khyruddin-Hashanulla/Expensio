# Expensio

Track, split, settle. A MERN-stack expense tracker with group expense splitting, debt simplification, budgets, and settlements.

## Stack

- **Client**: React 18 + Vite, Tailwind CSS, React Router, TanStack Query, axios, Socket.io client
- **Server**: Node.js + Express, Mongoose (MongoDB), Zod validation, JWT auth with refresh-token rotation, Socket.io
- **Infra**: Docker + docker-compose (MongoDB, API, nginx-served client)

## Features

- Email/password auth with short-lived access tokens and rotating refresh tokens (httpOnly cookie)
- Personal income/expense tracking with categories and monthly summaries
- Monthly budgets per category with spend progress
- Groups with member management (admin/member roles)
- Expense splitting: equal, percentage, and custom shares — cent-exact with largest-remainder rounding
- Balance computation and greedy debt simplification (minimal settlement suggestions)
- Idempotent settlement recording
- Audit logging of mutations

## Local development

Requires Node 20+ and pnpm.

```bash
pnpm install:all   # installs client + server deps
pnpm dev           # runs server (:5000) and client (:3000) together
```

In development, if `MONGO_URI` is not set the server automatically starts an in-memory MongoDB (`mongodb-memory-server`) so no local Mongo install is required. Data resets on restart.

To use a real database, copy `server/.env.example` to `server/.env` and set `MONGO_URI`.

## Deploy: Frontend on Vercel + Backend on Render

### 1. Backend (Render)

Option A — Blueprint: point Render at this repo; it reads `render.yaml` automatically.

Option B — Manual: create a **Web Service** with:
- **Root Directory**: `server`
- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/v1/health`

Environment variables (Render dashboard):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas connection string (Atlas free tier works — it is a replica set, required for settlement transactions) |
| `JWT_SECRET` | strong random string (`openssl rand -base64 48`) |
| `JWT_REFRESH_SECRET` | different strong random string |
| `CLIENT_ORIGIN` | your Vercel URL, e.g. `https://expensio.vercel.app` (no trailing slash) |
| `GOOGLE_CLIENT_ID` | optional — Google OAuth Web Client ID |

The server fails fast on boot if any required production variable is missing.

### 2. Frontend (Vercel)

Import the repo into Vercel with:
- **Root Directory**: `client`
- Framework preset: **Vite** (build `npm run build`, output `dist` — auto-detected)

Environment variables (Vercel dashboard):

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api/v1` |
| `VITE_SOCKET_URL` | `https://<your-render-service>.onrender.com` |

`client/vercel.json` already contains the SPA rewrite so deep links (e.g. `/groups/123`) work.

### 3. After both are live

1. Set `CLIENT_ORIGIN` on Render to the final Vercel URL and redeploy.
2. If using Google sign-in, add the Vercel URL to **Authorized JavaScript origins** in Google Cloud Console.
3. Auth cookies are cross-site (`SameSite=None; Secure`) — this is already configured for production.

> Note: password-reset links and signup OTP codes are returned in the API response in development only. In production, wire an email provider (e.g. Resend, SendGrid) in `server/src/services/authService.js` where noted.

## Production with Docker

```bash
cp .env.example .env   # fill in JWT secrets
docker compose up --build
```

The app is served at http://localhost:8080. nginx serves the built client and proxies `/api` and `/socket.io` to the API container. MongoDB data persists in the `mongo-data` volume.

## Project structure

```
client/            React SPA (Vite)
  src/pages/       Dashboard, Expenses, Budgets, Groups, GroupDetail, Settlements, Login, Register
  src/hooks/       TanStack Query data hooks
  src/lib/         axios API client (auto token refresh), socket, formatters
server/            Express API
  src/models/      Mongoose schemas
  src/services/    Business logic (transactions, groups, balances, settlements, budgets, auth)
  src/utils/       Split algorithm, debt simplification, money rounding
  src/routes/      /api/v1 router
```

## API overview

All routes are under `/api/v1` and require a Bearer access token unless noted.

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` (cookie), `POST /auth/logout` — public
- `GET/POST /transactions`, `GET /transactions/summary`, `PUT/DELETE /transactions/:id`
- `GET/POST /budgets`, `DELETE /budgets/:id`
- `GET/POST /groups`, `GET /groups/:id`, `POST /groups/:id/members`, `GET /groups/:id/balances`, `GET /groups/:id/simplify`, `GET /groups/:id/settlements`
- `POST /settlements` (requires `idempotencyKey`), `PUT /settlements/:id`
# Expensio
