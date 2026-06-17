# Next Steps — Productionizing i3 Space for ~30 Users

A prioritized, actionable checklist for moving the app from a working demo to something a small group (<30 people, single region) can use day-to-day.

Items are ordered by importance. **Steps 1–4 are the line between "demo" and "real users can use this."** 5–7 are quality-of-life. 8+ are preventative work for as the app grows.

---

## ✅ Status (as of v0.2 hardening pass)

> ## ⚠️ Active production blocker — Railway trial expired (2026-05-18)
>
> The live backend at `https://comfortable-patience-production-82bf.up.railway.app` is currently **offline**. Every previous Railway deployment is marked `REMOVED` and `railway up` fails with *"Your trial has expired. Please select a plan to continue using Railway."* The v0.2 cut-over completed steps 1–3 of [`docs/migration-prod.md`](migration-prod.md) (env vars set, passwords already hashed in the live sheet) but steps 4–7 (deploy + smoke test) need either:
>
> - **Upgrade Railway → Hobby ($5/mo)** at <https://railway.com/account/plans> — fastest, ~2 minutes.
> - **Migrate to Render free tier** — see [Alternative host migration](migration-prod.md#alternative-host-migration). ~30 min of work but no monthly cost.

| Step | Status | Notes |
|---|---|---|
| 1. Version control | **TODO** | `.gitignore` is in place — ready to `git init` and push to a private repo |
| 2. Fix authentication | **DONE** ✅ | bcrypt hashes in `Sheet1`, JWT bearer tokens, every data route protected. See [`docs/migration-prod.md`](migration-prod.md) |
| 3. Rate-limit login | **DONE** ✅ | `slowapi` 5/min/IP on `/auth/login`, configurable via `LOGIN_RATE_LIMIT` |
| 4. Move secrets out of the sheet | **TODO (recommended)** | Tokens still live in the `tokens` sheet; move to 1Password before sharing the URL with users |
| 5. Stop the backend sleeping | **BLOCKING NOW** ⚠️ | Trial-tier auto-sleep is no longer the issue — the trial *expired* and Railway pulled the container. Upgrade to Hobby ($5/mo) or migrate hosts |
| 6. Error monitoring (Sentry) | **READY** | Backend hook is in place — just set `SENTRY_DSN` on Railway |
| 7. Custom domain | **TODO** | Optional but recommended before broader rollout |
| 8. Structured logging | **DONE** ✅ | JSON logs with `request_id`, key events tagged with `event` field |
| 9. Postgres migration plan | **PLANNED** | Stay on Sheets while user count <30; revisit when reads cross ~30/min sustained |
| 10. Sheet backups | **TODO** | Apps Script weekly copy to a `backups/` Drive folder |
| 11. User management UI | **TODO** | Manual sheet edits + `python -m scripts.migrate_passwords --apply` for now |
| 12. Session persistence | **DONE** ✅ | localStorage token survives refresh; auto-revalidated via `GET /auth/me` |
| 13. CI | **TODO** | Add `.github/workflows/ci.yml` once the repo is on GitHub (step 1) |
| 14. Privacy policy | **TODO** | Static markdown page; add before sharing externally |

---

## 1. Get the code into version control

**Why:** The current deployment is a single-laptop-failure away from losing the entire app. There is no review history, no rollback, no second copy.

**Estimated time:** ~15 minutes

**Steps:**
- [x] `.gitignore` is in place at the repo root and excludes `**/.env`, `backend/credentials/*.json`, `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, `backups/`, and the local screenshot files.
- [ ] Create a **private** GitHub repo (e.g. `i3-space`)
- [ ] Run `git init`, commit, and push to `main`
- [ ] After the first push, search the repo on GitHub for `AIza`, `service_account`, `JWT_SECRET`, `password` to catch any accidental leaks
- [ ] Add a short `README.md` at the repo root pointing to `docs/`

**Done when:** You can `git clone` the repo onto a fresh machine and the secrets are *not* in the clone.

---

## 2. Fix authentication (the biggest hole) — ✅ DONE in v0.2

**Why:** Two serious problems were addressed:
1. Passwords were stored in **plaintext** in a Google Sheet.
2. `POST /auth/login` returned `{success: true}` but issued no token; all data endpoints were **publicly accessible**.

**What shipped (option A — rolled our own):**

- [x] Passwords are now **bcrypt-hashed** (cost 12) in `Sheet1` column B. The verifier (`backend/app/services/sheets.py`) tolerates legacy plaintext only as a one-time migration bridge and logs a `plaintext_password_compare` warning whenever the bridge fires.
- [x] One-shot migrator: `python -m scripts.migrate_passwords --apply` hashes every plaintext row idempotently.
- [x] **JWT bearer tokens** are issued on successful login (HS256, 7-day default, env-configurable via `JWT_EXPIRES_SECONDS`). Secret comes from `JWT_SECRET`. Rotating the secret invalidates every outstanding session.
- [x] FastAPI **`require_user` dependency** (`backend/app/dependencies/auth.py`) is attached to every data router in `main.py` — `/tracker`, `/volunteers`, `/loyalty`, `/outreach`, `/business`, `/sponsorships`, `/media-sales`, `/team`.
- [x] Frontend uses a shared **axios instance** with a request interceptor that attaches `Authorization: Bearer <token>` and a response interceptor that clears the session + bounces to login on `401`. Token lives in `localStorage` and survives page refresh; `GET /auth/me` validates it on app mount.

**Verified end-to-end with Playwright + curl:** `GET /tracker/rows` with no header → `401 {"detail":"Missing bearer token"}`. With a tampered token → `401 {"detail":"Invalid or expired token"}`. With a fresh token → `200 OK`. See [`docs/migration-prod.md`](migration-prod.md) for the production cut-over steps.

---

## 3. Rate-limit the login endpoint — ✅ DONE in v0.2

- [x] `slowapi` is in `requirements.txt`; shared `Limiter` lives in `app/rate_limit.py`.
- [x] `/auth/login` is decorated with `@limiter.limit(LOGIN_RATE_LIMIT)` (default `5/minute` per IP, configurable via the env var).
- [x] `RateLimitExceeded` is registered as a JSON exception handler in `main.py`. The frontend `LoginForm` recognises HTTP 429 and shows `"Too many login attempts. Please wait a minute and try again."`
- [x] Verified locally — attempts 1–5 return 401, 6+ return 429.

---

## 4. Move secrets out of the Google Sheet

**Why:** The `tokens` tab currently contains the Railway deploy token, project IDs, service account email, and spreadsheet ID. Anyone with view access to that sheet can deploy to your Railway project or read every config value.

**Estimated time:** ~30 minutes

**Steps:**
- [ ] Create a 1Password / Bitwarden / Apple Keychain vault entry called "i3-space deploy"
- [ ] Move the following out of the `tokens` sheet and into the vault:
  - `RAILWAY_PROJECT_TOKEN`
  - `GOOGLE_SERVICE_ACCOUNT` JSON (full key file)
  - Any future API keys (Sentry DSN, JWT secret, etc.)
- [ ] Leave only **non-sensitive** identifiers in the sheet if you want a public reference (project IDs, URLs)
- [ ] Update `docs/deployment.md` to point at the vault instead of the sheet
- [ ] Revoke and regenerate the existing Railway token (since it was stored insecurely)

**Done when:** The `tokens` sheet contains nothing that could be used to deploy code or access user data.

---

## 5. Stop the backend from sleeping

**Why:** Railway Trial puts idle containers to sleep. First request after idle = ~10–30 second cold start. Users will think the app is broken.

**Estimated time:** ~15 minutes

**Pick one:**

### Option A — Railway Hobby ($5/mo, recommended)
- [ ] Upgrade the Railway project to Hobby plan
- [ ] Containers never sleep; you also get more resources

### Option B — UptimeRobot (free)
- [ ] Sign up at [uptimerobot.com](https://uptimerobot.com)
- [ ] Add an HTTP(s) monitor for `https://comfortable-patience-production-82bf.up.railway.app/health`
- [ ] Interval: 5 minutes
- [ ] Bonus: configure email alerts so you find out before users do when the backend is down

**Done when:** Hitting the app after 30+ minutes of idleness responds in <1 second.

---

## 6. Add error monitoring (Sentry)

**Why:** Without this, you find out about bugs from frustrated users instead of from alerts. Sentry's free tier (5k events/month) is plenty for 30 users.

**Status:** Backend is **ready to opt-in**; just set `SENTRY_DSN`. Frontend init still to do.

**Estimated time:** ~30 minutes

**Steps:**
- [ ] Create a free Sentry account; create two projects: `i3-space-frontend` (React) and `i3-space-backend` (Python/FastAPI)
- [x] **Backend:** `sentry-sdk[fastapi]` already installed and initialised in `app/main.py` — no-op when `SENTRY_DSN` is unset. Set the DSN on Railway to enable.
- [ ] **Frontend:** `npm install @sentry/react`, init in `main.tsx` with `VITE_SENTRY_DSN`. (`.env.example` already lists the variable.)
- [ ] Trigger a test error on each side to confirm events arrive in Sentry
- [ ] Set up a Slack/email alert for new issues
- [ ] (Optional) Configure source maps for the frontend so stack traces are readable

**Done when:** A thrown error in either app shows up in your Sentry dashboard within ~10 seconds.

---

## 7. Custom domain

**Why:** `frontend-beta-sand-19.vercel.app` looks untrustworthy and is unmemorable. A real domain also future-proofs you against Vercel/Railway URL changes.

**Estimated time:** ~1 hour (mostly DNS propagation wait)

**Steps:**
- [ ] Buy a domain (~$10–15/yr on [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) or Namecheap)
- [ ] Add domain to Vercel project: **Settings → Domains → Add** `app.yourdomain.com`
- [ ] Add domain to Railway service: **Settings → Networking → Custom Domain** `api.yourdomain.com`
- [ ] Configure DNS (Vercel and Railway both show you the exact CNAME records to add)
- [ ] Wait for DNS + SSL cert provisioning (usually 5–30 min)
- [ ] Update the frontend's `VITE_API_URL` to `https://api.yourdomain.com` and redeploy
- [ ] Update `ALLOWED_ORIGINS` on Railway to include `https://app.yourdomain.com`
- [ ] Tighten the CORS regex — drop the `*.vercel.app` allowlist now that you have a stable domain
- [ ] Update `docs/deployment.md` with the new URLs

**Done when:** `https://app.yourdomain.com` loads the app and successfully calls `https://api.yourdomain.com`.

---

## 8. Add structured logging — ✅ DONE in v0.2

- [x] `python-json-logger` configured in `app/logging_setup.py`; every record is one JSON line on stdout (which Railway aggregates).
- [x] Key events tagged with an `event` field — `login_failed`, `login_succeeded`, `login_credentials_store_error`, `plaintext_password_compare`, `app_startup`, `sentry_enabled`, `jwt_secret_missing`.
- [x] `RequestIdMiddleware` (`app/middleware/request_id.py`) generates or echoes an `X-Request-ID` header and stores it in a `ContextVar`. The JSON formatter picks it up automatically, so a single user request is traceable across every log line.
- [ ] Pipe to [BetterStack](https://betterstack.com) (free tier, 1GB/mo) once log volume justifies it.

You can now answer "did `user@example.com` log in today?" by grepping for `"event": "login_succeeded"` and the email in Railway's log search.

---

## 9. Plan the Postgres migration (do before user count grows)

**Why:** Google Sheets is technically fine for ~30 users with light usage, but it has real limits:
- Sheets API rate limits (~60 reads / 100 writes per minute per user)
- No transactions, no concurrent-write protection — two simultaneous tracker inserts can corrupt rows
- No backups (besides manual exports)
- No indexes — every query reads the whole sheet

**Estimated time:** 1–2 days when you actually do it. Planning now is ~30 minutes.

**Now (planning):**
- [ ] Add the Railway Postgres add-on (~$5/mo) when you're ready
- [ ] Sketch the schema:
  ```
  users(id, email, password_hash, created_at)
  tracker_entries(id, user_id, platform, date, channel_name, views, minutes_watched, created_at)
  channels(id, platform, name)
  ```
- [ ] Decide on an ORM: SQLAlchemy + Alembic for migrations is the FastAPI default

**Later (migration day):**
- [ ] Spin up Postgres, write Alembic migrations
- [ ] Write a one-time import script: read each sheet tab → insert into Postgres
- [ ] Replace `gspread` calls in `services/` with SQLAlchemy queries
- [ ] Keep the Google Sheet as a read-only archive for ~30 days, then delete

**Done when:** No code path reads or writes to Google Sheets, and Railway's automatic daily Postgres backups are running.

---

## 10. Backups (interim, until you migrate to Postgres)

**Why:** If someone accidentally deletes a row or the whole sheet, you currently have no recovery path.

**Estimated time:** ~15 minutes

**Steps:**
- [ ] Open the Google Sheet → Extensions → Apps Script
- [ ] Add a script that copies the sheet to a `backups/` Drive folder, suffixed with the date
- [ ] Set a weekly trigger (Apps Script → Triggers → Add Trigger → Time-driven → Weekly)
- [ ] Verify after a week that backups are landing in the folder

**Done when:** You can see at least one dated backup copy of the sheet in Drive.

---

## 11. User management UI

**Why:** Adding a new user currently means manually editing a Google Sheet row. Tedious for you, error-prone, and you're the bottleneck.

**Estimated time:** Half a day. Skip entirely if you went with Clerk/Supabase in step 2 — they handle this for you.

**Steps:**
- [ ] Add an `is_admin` flag to the user table/sheet
- [ ] Build a simple `/admin` page in the frontend, gated to admin users
  - List users
  - "Add user" form (email + temporary password)
  - "Reset password" button (generates a new temp password, emails it via [Resend](https://resend.com) free tier)
  - "Disable user" button
- [ ] Add corresponding admin-only endpoints on the backend, all guarded by an `is_admin` check

**Done when:** You can onboard a new user without opening Google Sheets.

---

## 12. Session persistence / "Remember me" — ✅ DONE in v0.2

- [x] JWT lives in `localStorage` (key `i3.access_token`) with the email and expiry timestamp alongside it. See `frontend/src/api/session.ts`.
- [x] On app mount, `App.tsx` calls `getSession()` then `GET /auth/me` to validate before deciding to render the dashboard or the login screen.
- [x] "Sign out" button in the dashboard header clears `localStorage` via `clearSession()` and returns to the login form.
- [ ] **Optional next:** add a `POST /auth/refresh` endpoint and switch to short-lived tokens (15 min) + refresh tokens. Not needed at 30-user scale.

**Verified:** closing the browser tab and reopening keeps the user signed in for the full token lifetime (7 days by default).

---

## 13. Lightweight CI

**Why:** Catches obvious regressions before they hit production. Eliminates the "it works on my laptop" deploy.

**Estimated time:** ~1 hour

**Steps:**
- [ ] Add a `.github/workflows/ci.yml` that runs on PRs:
  - Backend: `pip install -r requirements.txt && pytest` (write at least 2–3 smoke tests for `/auth/login` and tracker CRUD with mocked Sheets)
  - Frontend: `npm ci && npm run build && npm run lint`
- [ ] (Optional) Auto-deploy on merge to `main` using Railway's GitHub integration and Vercel's GitHub integration — this replaces your manual `railway up` / `vercel --prod` commands

**Done when:** Pushing a broken commit to a PR shows a red X on GitHub before you can merge.

---

## 14. Privacy policy and acceptable-use note

**Why:** You're collecting email addresses (PII). Even at 30 users, a one-page privacy/ToS document is the right thing to do legally and reputationally.

**Estimated time:** ~30 minutes

**Steps:**
- [ ] Use a generator like [GetTerms](https://getterms.io/) or [Termly](https://termly.io/) for boilerplate
- [ ] State plainly: what data you collect (email, tracker entries), where it's stored (Google Sheets / Postgres on Railway), how to request deletion (email you)
- [ ] Add `/privacy` and `/terms` routes on the frontend (just static markdown)
- [ ] Link them from the login page footer

**Done when:** A user can read and link to a privacy policy from the app.

---

## Cost summary

| Item | Monthly cost |
|---|---|
| Railway Hobby (no sleeping) | $5 |
| Vercel Hobby | $0 (well under free tier) |
| Custom domain (~$12/yr) | ~$1 |
| Sentry / UptimeRobot / Cloudflare DNS | $0 |
| Google Sheets (interim) | $0 |
| Postgres on Railway (after step 9) | ~$5 |
| Resend (transactional email, after step 11) | $0 (3k/mo free) |
| **Total before Postgres migration** | **~$6** |
| **Total after Postgres migration** | **~$11** |

---

## Suggested execution order over a weekend

If you want to ship safely as fast as possible, here's a realistic 2-day plan:

**Saturday morning (~3 hours)**
- Step 1 — push to GitHub
- Step 4 — move secrets out of the sheet, rotate the Railway token
- Step 5 — Railway Hobby OR UptimeRobot

**Saturday afternoon (~4 hours)**
- Step 2 — auth (use Clerk/Supabase to save time)
- Step 3 — rate limiting

**Sunday morning (~2 hours)**
- Step 6 — Sentry on both apps
- Step 7 — custom domain (mostly DNS waiting)

**Sunday afternoon (~2 hours)**
- Step 8 — structured logging
- Step 10 — backup script
- Step 14 — privacy policy

That's the minimum viable production setup. Steps 9, 11, 12, 13 can come over the following weeks as you actually onboard users and feel the friction.
