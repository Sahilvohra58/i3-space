# Deployment Guide

## Overview

The i3 Space app is split into two independently deployed services:

| Layer | Platform | URL |
|---|---|---|
| Frontend (React/Vite) | Cloudflare Pages | https://i3-space.pages.dev |
| Backend (FastAPI) | Railway | https://comfortable-patience-production-82bf.up.railway.app |

All secrets and deployment tokens are stored in the **`tokens` sheet** of the Google Sheet `i3-space-credentials`. See [Secrets & Token Storage](#secrets--token-storage) for details.

> **Production hardening (v0.2):** Passwords are bcrypt-hashed in Sheet1, the backend issues JWT bearer tokens (7-day expiry), every data route requires `Authorization: Bearer <token>`, `/auth/login` is rate-limited to 5/min/IP, structured JSON logs include a request-id, and Sentry is plug-in-ready. See [Authentication & security](#authentication--security) below for details.

---

## Architecture

```
User Browser
    │  Authorization: Bearer <JWT>
    ▼
Cloudflare Pages (frontend)           ← static React/Vite build, global CDN
    │   HTTPS requests
    ▼
Railway (backend FastAPI)             ← Python, Uvicorn, port $PORT
    │   • JWT verify on every protected route
    │   • slowapi rate-limits /auth/login
    │   • JSON logs with request_id
    ▼
Google Sheets (i3-space-credentials)  ← data store: bcrypt-hashed users,
                                        trackers, snapshots, channels
```

---

## Authentication & security

### Login flow

1. User POSTs `{email, password}` to `/auth/login`.
2. Backend reads the row from `Sheet1`, verifies the password against the bcrypt hash in column B, and on success issues a JWT signed with `JWT_SECRET` (HS256, 7-day expiry by default).
3. Frontend stores the JWT in `localStorage` (`i3.access_token`).
4. Every subsequent request is sent with `Authorization: Bearer <token>` by a shared axios interceptor (`frontend/src/api/client.ts`).
5. Any backend response with status `401` triggers the frontend to clear the session and bounce back to the login page.

### What's protected

| Endpoint | Auth required? |
|---|---|
| `POST /auth/login` | No (rate-limited to `LOGIN_RATE_LIMIT`, default `5/minute/IP`) |
| `GET /auth/me` | Yes (used by the frontend to validate a stored token on page-load) |
| `GET /healthz`, `GET /health` | No |
| `GET/POST/DELETE /tracker/...`, `/volunteers/...`, `/loyalty/...`, `/outreach/...`, `/business/...`, `/sponsorships/...`, `/media-sales/...`, `/team/...` | **Yes** |

A missing or invalid token returns `401 {"detail": "Missing bearer token"}` or `401 {"detail": "Invalid or expired token"}`.

### Password storage

Passwords live in `Sheet1` column B as bcrypt hashes (`$2b$12$...`). The verifier (`app/services/sheets.py`) accepts either a bcrypt hash or — as a one-time migration bridge — a legacy plaintext value, and logs a `plaintext_password_compare` warning whenever it falls back to plaintext. Once `scripts/migrate_passwords.py --apply` has been run, every row is hashed and the bridge becomes unreachable.

### Rotating the JWT secret

Setting a new `JWT_SECRET` on Railway and redeploying invalidates every outstanding token (everyone is forced to log in again). Useful if you suspect a token was leaked or you want to terminate all sessions.

### Adding a user

Add a row to `Sheet1` with the email in column A and a *plaintext password* in column B, then re-run the migrator to hash it:

```bash
cd backend
source .venv/bin/activate
python -m scripts.migrate_passwords --apply
```

The script is idempotent — it only touches rows whose password cell isn't already a bcrypt hash.

---

## Secrets & Token Storage

All credentials and deployment tokens are kept in the **`tokens` sheet** of the Google Sheet:

> **Google Sheet:** [i3-space-credentials](https://docs.google.com/spreadsheets/d/1XDSB_93xKEcM28GZ1ZtVUhhu6MEbouTbUIGwlOlfvHo)  
> **Sheet tab:** `tokens`

| Row | Key | Value | Notes |
|---|---|---|---|
| 2 | `RAILWAY_PROJECT_TOKEN` | `<see tokens sheet>` | Project-scoped token for `railway up` deploys (i3-space-deploy, production) |
| 3 | `CF_ACCOUNT_EMAIL` | `sahil@i3institute.ca` | Cloudflare account email |
| 4 | `CF_ACCOUNT_ID` | `<see tokens sheet>` | Cloudflare account ID (Sahil@i3institute.ca's Account) |
| 5 | `CF_PAGES_API_TOKEN` | `<see tokens sheet>` | API token with Cloudflare Pages: Edit permission |
| 6 | `CF_PAGES_PROJECT_NAME` | `i3-space` | Cloudflare Pages project name |
| 7 | `CF_FRONTEND_URL` | `https://i3-space.pages.dev` | Live production frontend URL |
| 8 | `RAILWAY_BACKEND_URL` | `https://comfortable-patience-production-82bf.up.railway.app` | Live production backend URL |
| 9 | `RAILWAY_PROJECT_ID` | `a0520d55-d84a-4ad8-bb56-1985c5faf46e` | Railway project UUID |
| 10 | `RAILWAY_SERVICE_ID` | `f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1` | Railway service UUID (used with `--service` flag) |
| 11 | `GOOGLE_SPREADSHEET_ID` | `1XDSB_93xKEcM28GZ1ZtVUhhu6MEbouTbUIGwlOlfvHo` | Google Sheet ID used as app database |
| 12 | `GOOGLE_SERVICE_ACCOUNT` | `i3-space-tracker@eat-ingredient.iam.gserviceaccount.com` | Service account email for Google Sheets API |

**When you generate a new token on any platform, add a row immediately** with the key name, value, and a short note describing its scope and purpose.

---

## Backend — Railway

### First-time setup (already done)

1. Created account at [railway.com](https://railway.com) with `vohrasahil58@gmail.com`
2. Connected GitHub to unlock the Trial plan (removes network restrictions — no code is pushed to GitHub; this is just for account verification)
3. Created a project named **comfortable-patience**
4. Generated a project-scoped token (`i3-space-deploy`) and saved it to the `tokens` sheet

### Deploying

The backend is deployed directly from the local `backend/` folder via the Railway CLI — no GitHub push required.

```bash
cd backend
RAILWAY_TOKEN=<RAILWAY_PROJECT_TOKEN from tokens sheet> \
  railway up --detach --service f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1
```

Railway uses **Nixpacks** to auto-detect Python, install dependencies from `requirements.txt`, and start the server using the command in `railway.toml`:

```toml
[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

### Environment variables (set in Railway dashboard)

Navigate to:  
`Project → comfortable-patience → Variables`

| Variable | Value | Required | Notes |
|---|---|---|---|
| `SPREADSHEET_ID` | `1XDSB_93xKEcM28GZ1ZtVUhhu6MEbouTbUIGwlOlfvHo` | ✓ | Google Sheet ID |
| `SHEET_NAME` | `Sheet1` | ✓ | Tab with login credentials |
| `TRACKER_SHEET_NAME` | `youtube_tracker` | ✓ | Tab with tracker rows |
| `CHANNELS_SHEET_NAME` | `channels` | ✓ | Tab with channel dropdown options |
| `GOOGLE_CREDENTIALS_JSON` | `{"type":"service_account",...}` | ✓ | Full service account JSON as a single-line string |
| `JWT_SECRET` | 48 random url-safe bytes | ✓ | Generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. **Rotate to log everyone out.** |
| `ALLOWED_ORIGINS` | `https://i3-space.pages.dev,http://localhost:5173` | ✓ | Comma-separated CORS allowlist |
| `ALLOW_PAGES_PREVIEWS` | `true` (default) | – | Allows any `*.pages.dev` origin (Cloudflare Pages previews). Set to `false` once a stable custom domain is in place. |
| `LOGIN_RATE_LIMIT` | `5/minute` (default) | – | Per-IP slowapi limit on `/auth/login` |
| `JWT_EXPIRES_SECONDS` | `604800` (default = 7 days) | – | Token lifetime in seconds |
| `LOG_LEVEL` | `INFO` (default) | – | `DEBUG`, `INFO`, `WARNING`, etc. |
| `APP_ENV` | `production` | – | Tagged on every Sentry event and logged at startup |
| `APP_VERSION` | `0.2.0` | – | Surfaced via `/healthz` and Sentry releases |
| `SENTRY_DSN` | DSN from Sentry project | – | Leave unset to disable Sentry entirely |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.05` (default) | – | 5% transaction sampling |

> **CORS note:** when `ALLOW_PAGES_PREVIEWS=true` (default) the backend also accepts any `https://*.pages.dev` origin via regex, which covers all Cloudflare Pages preview deployments. Set it to `false` once you have a stable custom domain so preview URLs can't reach the API.

### Updating environment variables

1. Go to [Railway project variables](https://railway.com/project/a0520d55-d84a-4ad8-bb56-1985c5faf46e/service/f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1/variables)
2. Click **Raw Editor**, update values, click **Update Variables**
3. Click **Deploy** to apply — Railway will redeploy automatically

### Health checks

| Endpoint | Use | Response |
|---|---|---|
| `GET /healthz` | Uptime monitor + version reporting | `{"status":"ok","version":"0.2.0","environment":"production"}` |
| `GET /health` | Legacy alias kept for existing monitors | `{"status":"ok"}` |

```bash
curl https://comfortable-patience-production-82bf.up.railway.app/healthz
```

---

## Frontend — Cloudflare Pages

### First-time setup (already done)

1. Created API token `i3-space-pages-deploy` (Cloudflare Pages: Edit) at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Created Pages project via API: `POST /accounts/{account_id}/pages/projects` with `{"name":"i3-space","production_branch":"main"}`
3. Installed Wrangler as a dev dependency: `npm install -D wrangler`
4. Added `public/_redirects` for SPA client-side routing (replaces `vercel.json`)

### Deploying

```bash
cd frontend

# Build with production backend URL baked in
VITE_API_URL=https://comfortable-patience-production-82bf.up.railway.app npx vite build

# Deploy to Cloudflare Pages
CLOUDFLARE_API_TOKEN=<CF_PAGES_API_TOKEN from tokens sheet> \
CLOUDFLARE_ACCOUNT_ID=7f4d7445fc8a8d69af528bec10ef6d02 \
npx wrangler pages deploy dist --project-name i3-space --branch main
```

Wrangler uploads the `dist/` folder directly — no build step on Cloudflare's servers. Client-side routing is handled by `public/_redirects`:

```
/*    /index.html   200
```

### Environment variables

`VITE_API_URL` is injected **at build time** by Vite (it becomes a compile-time constant in the JS bundle). Pass it via the `VITE_API_URL` environment variable before running `vite build`.

The value is also stored in the Cloudflare Pages project settings (for reference), but since Cloudflare Pages doesn't run the build step in our workflow, the env var must be set locally at build time.

To change the backend URL in future:

```bash
VITE_API_URL=https://your-new-backend.up.railway.app npx vite build
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=7f4d7445fc8a8d69af528bec10ef6d02 \
  npx wrangler pages deploy dist --project-name i3-space --branch main
```

### Cloudflare Pages project details

| Field | Value |
|---|---|
| Project name | `i3-space` |
| Account | `Sahil@i3institute.ca's Account` (`7f4d7445fc8a8d69af528bec10ef6d02`) |
| Production URL | https://i3-space.pages.dev |
| Dashboard | https://dash.cloudflare.com/7f4d7445fc8a8d69af528bec10ef6d02/pages/view/i3-space |

---

## Redeploying in future

### First-time production cut-over to v0.2 (hardened build)

Run these once when promoting the new hardened code to production. Subsequent deploys can skip steps 1–2.

1. **Set the new required env vars on Railway** (see [Environment variables](#environment-variables-set-in-railway-dashboard)):
   - `JWT_SECRET` — generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`
   - Confirm `ALLOWED_ORIGINS` includes `https://i3-space.pages.dev`.
   - Optional: `SENTRY_DSN` if wiring up Sentry now.
2. **Hash existing passwords in `Sheet1`** (one-time, idempotent):
   ```bash
   cd backend
   source .venv/bin/activate
   python -m scripts.migrate_passwords          # dry-run, shows what will change
   python -m scripts.migrate_passwords --apply  # actually writes hashes
   ```
3. **Deploy backend, then frontend** (commands below).

### Backend change

```bash
cd backend

# Make your code changes, then:
RAILWAY_TOKEN=<RAILWAY_PROJECT_TOKEN from tokens sheet> \
  railway up --detach --service f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1
```

### Frontend change

```bash
cd frontend

VITE_API_URL=https://comfortable-patience-production-82bf.up.railway.app npx vite build

CLOUDFLARE_API_TOKEN=<CF_PAGES_API_TOKEN from tokens sheet> \
CLOUDFLARE_ACCOUNT_ID=7f4d7445fc8a8d69af528bec10ef6d02 \
npx wrangler pages deploy dist --project-name i3-space --branch main
```

### Both at once

```bash
# From repo root
cd backend && RAILWAY_TOKEN=<token> railway up --detach --service f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1

cd ../frontend
VITE_API_URL=https://comfortable-patience-production-82bf.up.railway.app npx vite build
CLOUDFLARE_API_TOKEN=<CF_PAGES_API_TOKEN> CLOUDFLARE_ACCOUNT_ID=7f4d7445fc8a8d69af528bec10ef6d02 \
  npx wrangler pages deploy dist --project-name i3-space --branch main
```

---

## Google Sheets data store

The app uses a single Google Sheet as its database. All sheet access goes through a **service account** (`i3-space-tracker@eat-ingredient.iam.gserviceaccount.com`).

| Tab | Purpose |
|---|---|
| `Sheet1` | Login credentials (email + password) |
| `youtube_tracker` | YouTube tracker rows |
| `volunteers_tracker` | Human Resources snapshot rows — volunteer metrics (active count, time-to-fill, churn), engagement metrics (NPS, training participation), and process metrics (roles with KPIs, review completion, mentorship participation) |
| `channels` | Channel options for the tracker dropdown |
| `tokens` | Deployment tokens and secrets |

> Category trackers (`loyalty_tracker`, `outreach_tracker`, `business_tracker`, `sponsorships_tracker`, `media_sales_tracker`, `team_tracker`) follow the same auto-create-on-first-GET convention as `volunteers_tracker`.

### Service account credentials

- **Project:** `eat-ingredient` (Google Cloud)
- **Service account:** `i3-space-tracker@eat-ingredient.iam.gserviceaccount.com`
- **Key file (local dev):** `backend/credentials/service_account.json`
- **Production:** stored as `GOOGLE_CREDENTIALS_JSON` env var on Railway (single-line JSON)

The backend automatically uses the env var in production and falls back to the local file for development (see `backend/app/services/tracker_sheets.py`).

---

## Cold start mitigation

Railway's Trial plan may sleep idle containers. Options to keep the backend warm:

1. **UptimeRobot (free):** ping `https://comfortable-patience-production-82bf.up.railway.app/health` every 5 minutes
2. **Frontend pre-warm:** the login page fires a silent `GET /health` on mount so the container is awake by the time the user clicks Sign In
3. **Upgrade to Railway Hobby ($5/mo):** services never sleep; the $5 free trial credit covers the first month

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login fails with CORS error | New Pages URL not whitelisted | Already handled by `allow_origin_regex` for `*.pages.dev`; check `ALLOWED_ORIGINS` for non-Cloudflare origins |
| `{"detail": "Could not fetch..."}` on tracker | `GOOGLE_CREDENTIALS_JSON` malformed or missing | Re-paste the single-line JSON in Railway variables |
| Backend returns 502 | Service crashed on startup | Check deploy logs in Railway dashboard |
| Frontend shows blank page | `VITE_API_URL` not set at build time | Rebuild with `VITE_API_URL=... npx vite build` then redeploy |
| `railway up` → "Unauthorized" | Wrong token | Get `RAILWAY_PROJECT_TOKEN` from the `tokens` sheet in Google Sheets |
| Login succeeds but every other request → 401 | `JWT_SECRET` env var changed (or unset) after a token was issued | Sign in again; if mid-deploy, set `JWT_SECRET` and redeploy |
| All users get 401 the morning after deploy | JWT expired (default 7 days) | Sign in again; raise `JWT_EXPIRES_SECONDS` if too short |
| `429 Too Many Requests` on login | Hit the `LOGIN_RATE_LIMIT` (default 5/min/IP) | Wait 60s; or raise `LOGIN_RATE_LIMIT` if a shared NAT IP serves many users |
| `plaintext_password_compare` in logs | A user row in `Sheet1` still has a plaintext password | Re-run `python -m scripts.migrate_passwords --apply` |
| Logs are unstructured plain text | Old build still deployed | Confirm v0.2 image is running — startup line should be a JSON object with `event: app_startup` |


Frontend: https://i3-space.pages.dev


Backend: https://comfortable-patience-production-82bf.up.railway.app
