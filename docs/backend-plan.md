# Backend

## Overview

A FastAPI service that validates Azure AD ID tokens on every request and exposes 8 protected data routers (YouTube tracker + Volunteers/HR + 6 business category snapshot trackers). Data is persisted in **Azure PostgreSQL Flexible Server** (private VNet). There is no username/password login — authentication is entirely delegated to Microsoft via Azure AD.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | FastAPI |
| Language | Python 3.11+ |
| Auth | Azure AD RS256 ID token validation via JWKS (`python-jose[cryptography]`, `httpx`) |
| Database | Azure PostgreSQL Flexible Server (SQLAlchemy + psycopg2) |
| Rate limiting | slowapi (IP-keyed; guards against abuse on any public endpoint) |
| Logging | python-json-logger (one JSON line per record; stdout → Azure Log stream) |
| Error monitoring | sentry-sdk (optional; no-op unless `SENTRY_DSN` is set) |
| Config | python-dotenv (local `.env`; production injects via Container App env vars) |
| Server | Uvicorn, port 8080 |
| CORS | FastAPI CORSMiddleware (env-driven allowlist + optional `*.pages.dev` regex) |

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                       # FastAPI app, CORS, middleware, router registration, Sentry init
│   ├── database.py                   # SQLAlchemy engine + SessionLocal factory + ensure_database_exists()
│   ├── orm_models.py                 # SQLAlchemy ORM models (User, TrackerRow, *Snapshot, Channel)
│   ├── rate_limit.py                 # Shared slowapi Limiter instance
│   ├── logging_setup.py              # JSON formatter + request_id ContextVar
│   ├── middleware/
│   │   └── request_id.py             # ASGI middleware: X-Request-ID on every request/response
│   ├── dependencies/
│   │   └── auth.py                   # require_user dependency — validates Azure AD Bearer token
│   ├── routers/
│   │   ├── auth.py                   # GET /auth/me (returns {email, name, oid} from token claims)
│   │   ├── tracker.py                # YouTube  (GET/POST/DELETE /tracker/rows, GET /tracker/channels)
│   │   ├── volunteers.py             # HR       (/volunteers/snapshots)
│   │   ├── loyalty.py                # Loyalty  (/loyalty/snapshots)
│   │   ├── outreach.py               # Outreach (/outreach/snapshots)
│   │   ├── business.py               # Business (/business/snapshots)
│   │   ├── sponsorships.py           # Sponsorships (/sponsorships/snapshots)
│   │   ├── media_sales.py            # Media Sales  (/media-sales/snapshots)
│   │   └── team.py                   # Team         (/team/snapshots)
│   ├── services/
│   │   ├── azure_ad.py               # validate_azure_token(): JWKS fetch + RS256 decode
│   │   ├── auth_db.py                # seed_initial_user() — populates the users table on first boot
│   │   ├── tracker_db.py             # YouTube tracker CRUD (PostgreSQL)
│   │   ├── volunteer_db.py
│   │   ├── loyalty_db.py
│   │   ├── outreach_db.py
│   │   ├── business_db.py
│   │   ├── sponsorships_db.py
│   │   ├── media_sales_db.py
│   │   └── team_db.py
│   └── models/                       # Pydantic request/response schemas
│       ├── auth.py
│       ├── tracker.py
│       ├── volunteers.py
│       ├── loyalty.py
│       ├── outreach.py
│       ├── business.py
│       ├── sponsorships.py
│       ├── media_sales.py
│       └── team.py
├── Dockerfile                        # Multi-stage build for ACR / Container Apps
├── requirements.txt
└── .env.example
```

> **Legacy `_sheets.py` files** still exist in `services/` from the Google Sheets era but are no longer called. They can be deleted once confirmed unused.

---

## Authentication

### How it works

1. The frontend acquires an Azure AD **ID token** (RS256, signed by Microsoft) via MSAL `acquireTokenSilent`.
2. The token is sent as `Authorization: Bearer <id-token>` on every API request.
3. `backend/app/dependencies/auth.py` extracts the token via `HTTPBearer`.
4. `backend/app/services/azure_ad.py` fetches the tenant's JWKS (cached in memory), decodes the token, and verifies audience (`CLIENT_ID`) and issuer.
5. The decoded payload (containing `preferred_username`, `name`, `oid`, etc.) is returned by `require_user` and injected into handler functions that need it.

### `GET /auth/me`

Returns the caller's identity from the Azure AD token claims. Used by the frontend on page load to confirm the session is still valid.

```json
{
  "email": "sahil.vohra@i3institute.ca",
  "name": "Sahil Vohra",
  "oid": "67789b20-72d3-453f-8880-258eeb0c086f"
}
```

### What's protected

Every data router (`/tracker`, `/volunteers`, `/loyalty`, `/outreach`, `/business`, `/sponsorships`, `/media-sales`, `/team`) is registered with `dependencies=[Depends(require_user)]` in `main.py`. A request without a valid token gets:

```
HTTP 401 Unauthorized
{"detail": "Missing bearer token"}
```

or

```
HTTP 401 Unauthorized
{"detail": "Invalid or expired token"}
```

---

## Database

SQLAlchemy ORM with PostgreSQL. The engine is configured in `app/database.py` using `DATABASE_URL` from the environment. Tables are created on startup via `Base.metadata.create_all(engine)`.

### Startup sequence (`app/main.py` → `_startup()`)

1. `ensure_database_exists()` — connects and verifies the `i3space` database exists.
2. `Base.metadata.create_all(engine)` — creates any missing tables.
3. `seed_initial_user()` — if `users` is empty and `INITIAL_USER_EMAIL`/`INITIAL_USER_PASSWORD` env vars are set, inserts the first user row. This is a one-time bootstrap; the `users` table is not used for authentication (Azure AD handles that).

### Tables

| Table | Purpose |
|---|---|
| `users` | Bootstrap only — not used for auth. Kept for future admin features. |
| `channels` | YouTube channel dropdown options |
| `tracker_rows` | YouTube tracker entries |
| `volunteer_snapshots` | Human Resources periodic snapshots |
| `loyalty_snapshots` | Loyalty & partnership snapshots |
| `outreach_snapshots` | Outreach snapshots |
| `business_snapshots` | Business enrolled snapshots |
| `sponsorship_snapshots` | Sponsorships snapshots |
| `media_sales_snapshots` | Media sales snapshots |
| `team_snapshots` | Team snapshots |

---

## Endpoints

### `GET /auth/me`
Returns identity from the Azure AD token. Used for session validation on app load.

### YouTube tracker
```
GET    /tracker/rows            → TrackerRow[]
POST   /tracker/rows            → 201 Created
DELETE /tracker/rows/{index}    → 204 No Content
GET    /tracker/channels        → string[]
```

### Business category trackers
All six business categories and HR follow the same pattern:
```
GET    /<category>/snapshots          → Snapshot[]
POST   /<category>/snapshots          → 201 Created
DELETE /<category>/snapshots/{index}  → 204 No Content
```
Where `<category>` is one of: `volunteers`, `loyalty`, `outreach`, `business`, `sponsorships`, `media-sales`, `team`.

### Health
```
GET /healthz    → {"status":"ok","version":"...","environment":"..."}
GET /health     → {"status":"ok"}  (legacy alias)
```

---

## Environment Variables

```
# --- Auth ---
AZURE_AD_TENANT_ID=d1aec0dc-1c2b-4541-9724-3a6f21519d9e
AZURE_AD_CLIENT_ID=0b7fb923-f379-4245-b319-a9c1725af4f5

# --- Database ---
DATABASE_URL=postgresql://user:pass@i3-postgressqldb.postgres.database.azure.com/i3space

# --- Bootstrap (first-run only) ---
INITIAL_USER_EMAIL=
INITIAL_USER_PASSWORD=

# --- CORS ---
ALLOWED_ORIGINS=http://localhost:5173
ALLOW_PAGES_PREVIEWS=true

# --- Observability ---
LOG_LEVEL=INFO
APP_VERSION=0.3.0
APP_ENV=development
# SENTRY_DSN=https://...@sentry.io/...
```

---

## Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # fill in DATABASE_URL + Azure AD IDs
uvicorn app.main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

Note: the production PostgreSQL is VNet-private (unreachable from outside Azure). Use a local Postgres instance for development.

---

## Observability

### Structured JSON logs

Every log record is one JSON line on stdout:

```json
{"ts": "2026-06-17 10:00:00,000", "level": "INFO", "logger": "app.main",
 "request_id": "abc123", "message": "app_startup", "event": "app_startup",
 "version": "0.3.0", "environment": "production"}
```

Key `event` values:

| `event` | When |
|---|---|
| `app_startup` | Process boot |
| `azure_token_invalid` | Token decode failed (DEBUG level) |
| `azure_token_validation_error` | Unexpected error during token validation |
| `initial_user_seeded` | First user row created on cold start |
| `sentry_enabled` | Sentry SDK initialised |

### Request IDs

`RequestIdMiddleware` reads or generates an `X-Request-ID` on every request and echoes it on the response. The JSON logger includes it on every line, so a single request is traceable across all logs it produces.
