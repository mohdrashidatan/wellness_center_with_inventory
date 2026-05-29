# Production Deployment Guide

## Architecture Overview

Two separate subdomains on Indohost cPanel:

| Subdomain | Purpose | Hosting |
|---|---|---|
| `tcplsys.primeapps.sg` | React frontend (static files) | Apache (cPanel file manager) |
| `api.tcplsys.primeapps.sg` | Express API | Phusion Passenger Node.js App |

---

## Environment Files

| File | Value | Used When |
|---|---|---|
| `client/.env` | `VITE_API_URL=http://localhost:5000` | Local dev (`npm run dev`) |
| `client/.env.production` | `VITE_API_URL=https://api.tcplsys.primeapps.sg` | Production build (`npm run build`) |
| `server/.env` PORT | `5000` | Local dev |
| `server/.env` FRONTEND_URL | `https://tcplsys.primeapps.sg` | Production CORS |

---

## Deployment Steps

### 1. Commit & Push

```bash
git add <changed files>
git commit -m "your message"
git push origin <branch>
```

### 2. Build the Frontend

```bash
cd client
npm run build
```

This uses `.env.production` automatically. Output goes to `client/dist/`.

### 3. Upload Files via cPanel File Manager or FTP

**Frontend** — upload to `tcplsys.primeapps.sg` document root:

| Local path | Upload to |
|---|---|
| `client/dist/` (all contents) | `domains/tcplsys.primeapps.sg/public_html/` |

**Backend** — upload to `api.tcplsys.primeapps.sg` Node.js app:

| Local path | Upload to |
|---|---|
| `server/src/models/<file>.js` | `domains/api.tcplsys.primeapps.sg/server/src/models/` |
| `server/src/controllers/<file>.js` | `domains/api.tcplsys.primeapps.sg/server/src/controllers/` |
| `server/src/routes/<file>.js` | `domains/api.tcplsys.primeapps.sg/server/src/routes/` |
| `server/src/routes/index.js` | `domains/api.tcplsys.primeapps.sg/server/src/routes/` |
| `server/package.json` (if dependencies changed) | `domains/api.tcplsys.primeapps.sg/server/` |

> If `package.json` changed, run `npm install --omit=dev` on the server after uploading.

### 4. Restart the API App

In cPanel → **Setup Node.js App** → find `api.tcplsys.primeapps.sg` → click **Restart**.

The frontend is static files so no restart is needed for frontend-only changes.

---

## Database Changes

If the deployment includes SQL changes (new tables, columns, etc.):

1. Connect to the production MySQL database via cPanel → phpMyAdmin
2. Run the SQL statements manually, or import the `.sql` file

The stock report features (added 2026-05) only **read** existing tables (`products`, `grnhd`, `grndetails`, `dohd`, `dodetails`, `poshd`, `poslines`, `customers`) — no schema changes required for those.

---

## Local Development Quick Reference

```bash
# Start backend
cd server && npm run dev        # runs on http://localhost:5000

# Start frontend
cd client && npm run dev        # runs on http://localhost:5173
```

Make sure `client/.env` has `VITE_API_URL=http://localhost:5000` for local dev.
After editing `.env`, restart the Vite dev server to pick up the change.
