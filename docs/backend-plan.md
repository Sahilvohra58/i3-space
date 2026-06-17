# Backend Plan

## Overview

A FastAPI service that issues short-lived JWT bearer tokens on `/auth/login` (after verifying a bcrypt-hashed password from `Sheet1`) and exposes 8 protected data routers (YouTube tracker + Volunteers + 6 category snapshot trackers) that all require a valid token. Data is persisted in Google Sheets via a service account.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | FastAPI | Async, auto-generated docs (Swagger), type hints |
| Language | Python 3.11+ | Modern, widely supported |
| Google Sheets | gspread (service account) | Read + write; same identity used for users sheet and tracker sheets |
| Password hashing | bcrypt | Industry-standard; cost factor 12 |
| Auth tokens | python-jose (HS256 JWT) | Stateless; one secret to rotate to invalidate every session |
| Rate limiting | slowapi | IP-keyed; cheap defense for `/auth/login` brute-force |
| Logging | python-json-logger | One JSON line per record; ships clean to Railway / BetterStack |
| Error monitoring | sentry-sdk (optional) | No-op unless `SENTRY_DSN` is set |
| Config / secrets | python-dotenv | Local `.env`; production injects via Railway env vars |
| Server | Uvicorn | ASGI server recommended for FastAPI |
| CORS | FastAPI CORSMiddleware | Env-driven allowlist + optional `*.vercel.app` regex |

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                       # FastAPI app, CORS, middleware, router registration, optional Sentry init
│   ├── rate_limit.py                 # Shared slowapi Limiter instance
│   ├── logging_setup.py              # JSON formatter + request_id ContextVar
│   ├── middleware/
│   │   └── request_id.py             # ASGI middleware that tags every request with X-Request-ID
│   ├── dependencies/
│   │   └── auth.py                   # require_user FastAPI dependency (validates JWT)
│   ├── routers/
│   │   ├── auth.py                   # POST /auth/login (rate-limited), GET /auth/me
│   │   ├── tracker.py                # YouTube  (GET/POST/DELETE /tracker/rows)
│   │   ├── volunteers.py             # Volunteers     (/volunteers/snapshots)
│   │   ├── loyalty.py                # Loyalty        (/loyalty/snapshots)
│   │   ├── outreach.py               # Outreach       (/outreach/snapshots)
│   │   ├── business.py               # Business       (/business/snapshots)
│   │   ├── sponsorships.py           # Sponsorships   (/sponsorships/snapshots)
│   │   ├── media_sales.py            # Media Sales    (/media-sales/snapshots)
│   │   └── team.py                   # Team           (/team/snapshots)
│   ├── services/
│   │   ├── sheets.py                 # User CRUD + bcrypt verify (service-account client)
│   │   ├── jwt_service.py            # issue_token / decode_token (HS256, env-driven secret)
│   │   ├── tracker_sheets.py         # YouTube tracker CRUD + shared _get_client()
│   │   ├── sheet_helpers.py          # Shared snapshot helpers: get_or_create_sheet,
│   │   │                             #   safe_int/float, get_all_snapshots,
│   │   │                             #   append_snapshot, delete_snapshot.
│   │   │                             #   Worksheet handles are memoised via lru_cache
│   │   │                             #   to halve Google Sheets read API calls.
│   │   ├── volunteer_sheets.py
│   │   ├── loyalty_sheets.py
│   │   ├── outreach_sheets.py
│   │   ├── business_sheets.py
│   │   ├── sponsorships_sheets.py
│   │   ├── media_sales_sheets.py
│   │   └── team_sheets.py
│   └── models/
│       ├── auth.py                   # LoginRequest + LoginResponse(access_token, expires_in, …)
│       ├── tracker.py
│       ├── volunteers.py
│       ├── loyalty.py
│       ├── outreach.py
│       ├── business.py
│       ├── sponsorships.py
│       ├── media_sales.py
│       └── team.py
├── scripts/
│   └── migrate_passwords.py          # One-shot bcrypt migration for legacy plaintext rows
├── credentials/
│   └── service_account.json          # Google service account key (git-ignored)
├── .env                              # env vars (git-ignored)
├── .env.example                      # Template
├── requirements.txt
└── README.md
```

> **Category services pattern.** All snapshot-style categories (volunteers/HR + the
> six business categories) are thin shells over `sheet_helpers.py`. Each
> `{category}_sheets.py` defines only:
>
> 1. `_HEADERS` — list of column names (date + metric fields)
> 2. `_FIELDS` — list of `(field_name, "int" | "float")` tuples telling the
>    shared parser how to decode each cell
> 3. A `_sheet()` accessor that calls `get_or_create_sheet(<env_var>, <default>, _HEADERS)`
> 4. `get_all_snapshots()` / `append_snapshot(...)` / `delete_snapshot(...)` —
>    one-line wrappers that delegate to the helpers.
>
> Adding a 7th category requires ~30 lines of code + a router + a Pydantic model
> + registering the router in `main.py`.

---

## Google Sheet Setup

### Tab 1 — Credentials (`Sheet1`)

| A (email) | B (password) |
|---|---|
| admin@i3space.com | admin123 |
| user@i3space.com | user456 |

- Accessed via **Google Sheets API key** (read-only, public sheet).

### Tab 2 — YouTube Tracker (`youtube_tracker`)

| A (date) | B (channel_name) | C (views) | D (minutes_watched) |
|---|---|---|---|
| 2026-04-10 | MrBeast | 5000000 | 12 |

- Created automatically by the backend if it does not exist.
- Accessed via **Google Service Account** (read-write).
- Service account must be granted **Editor** access to the spreadsheet.

### Tab 3 — Human Resources Tracker (`volunteers_tracker`)

| A (date) | B (active_volunteers) | C (avg_time_to_fill_days) | D (churn_count) | E (nps_score) | F (training_participation_rate) | G (roles_with_kpis_rate) | H (performance_review_completion_rate) | I (mentorship_participation_rate) |
|---|---|---|---|---|---|---|---|---|
| 2026-05-01 | 25 | 14 | 2 | 42.0 | 68.0 | 55.0 | 72.0 | 38.0 |

- One **snapshot row per period** (week / month — cadence is the operator's choice; the backend doesn't enforce it).
- Covers three metric groups on the Board: **Volunteer** (B–D), **Engagement** (E–F), and **Process** (G–I).
- Auto-created with headers on the first `GET /volunteers/snapshots` call.
- Accessed via the same **Google Service Account** as the YouTube tracker.
- **Backward compatible:** rows created before the engagement/process columns were added still load; missing cells default to `0`. If the tab already existed with a 4-column header, add the five new column names manually for readability (data entry works either way).

> Down-is-good fields for HR (`avg_time_to_fill_days`, `churn_count`) live in `frontend/src/components/board/categories/volunteerSpecs.ts`.

### Tabs 4–9 — Business Category Trackers

Each new category tab follows the same `<category>_tracker` schema. All are auto-created on the first GET call to their respective `/snapshots` endpoint.

| Tab | Columns (after `date`) | Down-is-good fields |
|---|---|---|
| `loyalty_tracker` | `customer_retention_rate`, `repeat_purchase_rate`, `avg_clv`, `partnership_renewal_rate`, `referral_rate` | — |
| `outreach_tracker` | `outreach_contacts_made`, `conversion_rate`, `response_rate`, `meetings_scheduled`, `followup_rate` | — |
| `business_tracker` | `active_business_clients`, `revenue_per_client`, `time_to_close_days`, `churn_rate` | `time_to_close_days`, `churn_rate` |
| `sponsorships_tracker` | `new_deals_closed`, `revenue_growth_rate`, `avg_deal_value`, `engagement_rate`, `retention_rate` | — |
| `media_sales_tracker` | `channel_sponsors`, `ad_revenue_per_sponsor` | — |
| `team_tracker` | `sales_recruited`, `training_hours_per_salesperson`, `sales_cycle_length_days` | `sales_cycle_length_days` |

> The "down-is-good" metadata lives in the **frontend** category specs (`frontend/src/components/board/categories/<category>Specs.ts`) — the backend stores raw values only.

---

## Endpoints

### `POST /auth/login`

Rate-limited by `slowapi` to `LOGIN_RATE_LIMIT` (default `5/minute` per source IP).

**Request body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Success response (HTTP 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 604800,
  "email": "user@example.com"
}
```

**Failure response (HTTP 401):**
```json
{ "success": false, "message": "Invalid credentials" }
```

**Rate-limited response (HTTP 429):**
```json
{ "error": "Rate limit exceeded: 5 per 1 minute" }
```

### `GET /auth/me`

Validates the bearer token and returns the identity, used by the frontend on
page-load to decide whether to skip the login screen.

```http
GET /auth/me
Authorization: Bearer <token>
```

```json
{ "email": "user@example.com", "expires_at": 1779726534 }
```

`401` if the token is missing, invalid, or expired.

### Auth on every other route

Every router below (`/tracker`, `/volunteers`, `/loyalty`, `/outreach`,
`/business`, `/sponsorships`, `/media-sales`, `/team`) is registered with
`dependencies=[Depends(require_user)]` in `main.py`. A request without a valid
`Authorization: Bearer <token>` header gets:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
{"detail": "Missing bearer token"}
```

---

## Credential Lookup Logic

1. Open the users sheet (`Sheet1`) using the service account.
2. Read all rows from column A (email) and column B (bcrypt hash or legacy plaintext).
3. For the row whose email matches case-insensitively, call `bcrypt.checkpw(...)` against the stored hash. Plaintext rows are accepted as a one-time migration bridge and emit a `plaintext_password_compare` warning so they're easy to spot in logs.
4. Match → caller gets a fresh JWT (HS256, signed with `JWT_SECRET`, default 7-day expiry).
5. No match → `401 Unauthorized`.

> Run `python -m scripts.migrate_passwords --apply` once after deploying v0.2 to bcrypt-hash any remaining plaintext rows. The script is idempotent.

---

## New Tracker Endpoints

### `GET /tracker/rows`
Returns all YouTube tracker rows.
```json
[{ "row_index": 1, "date": "2026-04-10", "channel_name": "MrBeast", "views": 5000000, "minutes_watched": 12 }]
```

### `POST /tracker/rows`
Appends a new row.
```json
{ "date": "2026-04-10", "channel_name": "MrBeast", "views": 5000000, "minutes_watched": 12 }
```
Response: `201 Created`

### `DELETE /tracker/rows/{row_index}`
Deletes a row by its 1-based data index (row 1 = first data row after the header).
Response: `204 No Content`

---

## Volunteers / Human Resources Endpoints

### `GET /volunteers/snapshots`
Returns all HR snapshots, ordered by sheet position (i.e. insertion order).
```json
[{
  "row_index": 1,
  "date": "2026-05-01",
  "active_volunteers": 25,
  "avg_time_to_fill_days": 14,
  "churn_count": 2,
  "nps_score": 42.0,
  "training_participation_rate": 68.0,
  "roles_with_kpis_rate": 55.0,
  "performance_review_completion_rate": 72.0,
  "mentorship_participation_rate": 38.0
}]
```

### `POST /volunteers/snapshots`
Appends a new snapshot row.
```json
{
  "date": "2026-05-16",
  "active_volunteers": 27,
  "avg_time_to_fill_days": 11,
  "churn_count": 1,
  "nps_score": 48.5,
  "training_participation_rate": 74.0,
  "roles_with_kpis_rate": 62.0,
  "performance_review_completion_rate": 78.0,
  "mentorship_participation_rate": 44.0
}
```
Response: `201 Created`

### `DELETE /volunteers/snapshots/{row_index}`
Deletes a snapshot by its 1-based data index. Response: `204 No Content`

---

## Category Endpoints (Loyalty, Outreach, Business, Sponsorships, Media Sales, Team)

Every business category exposes the same three endpoints. Replace `<category>` with one of: `loyalty`, `outreach`, `business`, `sponsorships`, `media-sales`, `team`.

```
GET    /<category>/snapshots          → CategorySnapshot[]
POST   /<category>/snapshots          → 201 Created
DELETE /<category>/snapshots/{index}  → 204 No Content
```

Each `CategorySnapshot` has `row_index`, `date`, and the metric fields listed in the schema table above.

---

## Google Sheets API rate-limit notes

The free Sheets API tier allows **60 read requests per minute per user**. With 8 active tabs (YouTube + Volunteers + 6 categories), a single Board mount fires 8 GETs in parallel. To stay under the cap, the backend memoises `gspread.Worksheet` handles per `(spreadsheet_id, sheet_name)` via `functools.lru_cache` (see `sheet_helpers._get_sheet_cached`). This cuts ~1 Sheets read per CRUD operation by skipping the worksheet-metadata lookup on subsequent calls.

For sustained heavy use, see `docs/next_steps.md` for the Postgres migration plan.

---

## Observability

### Structured JSON logs

`app/logging_setup.py` configures the root logger to emit one JSON object per
line, written to stdout (which Railway aggregates). Each record looks like:

```json
{"ts": "2026-05-18 12:33:07,054", "level": "INFO", "logger": "app.routers.auth",
 "request_id": "5ff177f37c30471db68d1f409580f556",
 "message": "login_failed", "event": "login_failed", "email": "wrong@i3space.com"}
```

Key events emitted by the app:

| `event`                       | When                                                      | Extras                       |
|-------------------------------|-----------------------------------------------------------|------------------------------|
| `app_startup`                 | Process boot                                              | version, env, CORS settings  |
| `login_failed`                | Bad credentials or unknown email                          | email                        |
| `login_succeeded`             | JWT issued                                                | email, expires_in            |
| `login_credentials_store_error` | Sheets API call threw                                   | (exception in traceback)     |
| `plaintext_password_compare`  | Migration still pending for a user row                    | —                            |
| `jwt_secret_missing`          | Dev fallback secret used because `JWT_SECRET` is unset    | —                            |
| `sentry_enabled`              | Sentry SDK initialised                                    | —                            |

### Request IDs

`app/middleware/request_id.py` reads an incoming `X-Request-ID` header (or
generates a fresh UUID), exposes it via a `ContextVar`, and echoes it on the
response. The JSON logger picks up the same value automatically, so a single
user request is traceable across every log line it produces.

### Sentry (optional)

Setting `SENTRY_DSN` enables `sentry-sdk` with the FastAPI integration. With
the DSN unset, the SDK is never imported and there is zero runtime cost.

---

## Rate limiting

`slowapi` is mounted in `main.py` and the `/auth/login` route is decorated
with `@limiter.limit(LOGIN_RATE_LIMIT)` (default `5/minute` per IP). Excess
requests get `429 Too Many Requests` and the frontend renders a friendly
"please wait a minute" message. The limit is intentionally only on login —
data routes already require a valid JWT, so abuse there would need to come
from an authenticated user.

---

## Environment Variables (`.env.example`)

```
# --- Google Sheets (required) ---
SPREADSHEET_ID=1XDSB_93xKEcM28GZ1ZtVUhhu6MEbouTbUIGwlOlfvHo
SHEET_NAME=Sheet1
TRACKER_SHEET_NAME=youtube_tracker
CHANNELS_SHEET_NAME=channels
GOOGLE_APPLICATION_CREDENTIALS=credentials/service_account.json
# GOOGLE_CREDENTIALS_JSON=...          # production: full JSON in one line

# --- Auth (required for production) ---
JWT_SECRET=change-me-to-something-long-and-random
JWT_EXPIRES_SECONDS=604800             # 7 days
LOGIN_RATE_LIMIT=5/minute

# --- CORS ---
ALLOWED_ORIGINS=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=true             # set to false in prod with a stable domain

# --- Observability ---
LOG_LEVEL=INFO
APP_VERSION=0.2.0
APP_ENV=development
# SENTRY_DSN=https://...@sentry.io/...
# SENTRY_TRACES_SAMPLE_RATE=0.05
```

The full template lives at `backend/.env.example`.

---

## Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                   # then fill in values
python -m scripts.migrate_passwords    # dry-run; add --apply to hash plaintext rows
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

## Future Considerations

- Migrate user store and trackers from Google Sheets to Postgres (see `docs/next_steps.md` §9).
- Add per-user roles (admin vs. viewer) and an `/admin` UI for user management.
- Refresh-token endpoint so JWTs can be shorter-lived (currently long-lived 7 days).
- Pytest test suite (currently rely on Playwright + curl smoke tests).
- Auto-rotate `JWT_SECRET` via a scheduled job once a refresh-token flow exists.
