# v0.2 Production Cut-Over Runbook

A copy-paste-ready checklist for promoting the hardened v0.2 build to the live Vercel + Railway deployment **for the first time**. Subsequent deploys are just the "Standard redeploy" section at the bottom.

Estimated wall-clock time: **20–30 minutes**, most of which is waiting for builds.

> ## ⚠️ Active blocker (as of 2026-05-18)
>
> Railway trial has expired. All previous backend deployments are marked `REMOVED` and `railway up` now fails with *"Your trial has expired. Please select a plan to continue using Railway."* — so steps 4–7 below are stuck until one of the following is done:
>
> 1. **Upgrade Railway to Hobby ($5/mo)** at <https://railway.com/account/plans>. Then re-run step 4. Fastest path; this was already next_steps.md §5.
> 2. **Migrate the backend to another host** (Render free tier, fly.io, or similar). See [Alternative host migration](#alternative-host-migration) at the bottom of this doc.
>
> Steps 1–3 (env vars, password migration) **are already done** against the live spreadsheet, so as soon as the host is unblocked the only remaining work is steps 4–7.
>
> Separately, the local Vercel CLI token has expired — running `vercel login` once (device-code flow) will fix it before step 5.

---

## Pre-flight (5 min)

- [x] **Backup taken.** Pre-hardening zip lives in `backups/i3-space-backup-pre-prod-hardening-20260518-122015.zip`. If anything goes wrong, you can unzip into a fresh folder and redeploy.
- [x] **Local tests green.** Backend boots, login → JWT → protected routes → logout all work locally. (Verified during the v0.2 hardening pass.)
- [ ] **Maintenance window noted.** During step 3 below, every currently logged-in user will see one 401 → re-login. Pick a quiet 10 minutes. *(Currently moot — prod is offline anyway because of the trial-expiration blocker above.)*
- [x] **Owner of `Sheet1` available.** You'll be writing back to it from the migration script.

---

## 1. Generate the new `JWT_SECRET` — ✅ DONE

A 48-byte url-safe secret was generated and set as `JWT_SECRET` on Railway during the 2026-05-18 cut-over attempt. Save it to your password manager under "i3-space — JWT_SECRET (prod)". If you've lost it, generate a new one with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

and replay step 2 with the new value (every existing session will be invalidated).

---

## 2. Set the new env vars on Railway — ✅ DONE

Open: `Project → comfortable-patience → Variables → Raw Editor`

Add or update:

```
JWT_SECRET=<paste the value from step 1>
JWT_EXPIRES_SECONDS=604800
LOGIN_RATE_LIMIT=5/minute
ALLOWED_ORIGINS=https://frontend-beta-sand-19.vercel.app,http://localhost:5173
ALLOW_VERCEL_PREVIEWS=true
APP_ENV=production
APP_VERSION=0.2.0
LOG_LEVEL=INFO
```

Optional (leave commented unless you want Sentry now):

```
# SENTRY_DSN=https://...@sentry.io/...
# SENTRY_TRACES_SAMPLE_RATE=0.05
```

Click **Update Variables** but **do not redeploy yet** — the migration in step 3 must happen first, otherwise live users will get 401s before they have hashed passwords.

---

## 3. Migrate plaintext passwords in `Sheet1` — ✅ DONE

The production sheet (`SPREADSHEET_ID=1XDSB...`) was migrated on 2026-05-18 — both `admin@i3space.com` and `user@i3space.com` are now bcrypt-hashed (`$2b$12$...`). The script is idempotent, so re-running is safe.

```bash
cd backend
source .venv/bin/activate
python -m scripts.migrate_passwords           # dry-run; review the list of emails
python -m scripts.migrate_passwords --apply   # actually writes hashes
```

> **Side effect of the migration:** The currently-running v0.1 backend (if it were online) would refuse every login because its code does plaintext string comparison against a bcrypt hash. That's why deploying the v0.2 code is now urgent — the sheet has moved on and only v0.2 understands it.

---

## 4. Deploy the backend

```bash
cd backend
RAILWAY_TOKEN=<RAILWAY_PROJECT_TOKEN from tokens sheet> \
  railway up --detach --service f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1
```

Wait ~2 minutes for the deploy, then smoke-test:

```bash
API=https://comfortable-patience-production-82bf.up.railway.app

# Health endpoint should now report the new version
curl -s $API/healthz
# → {"status":"ok","version":"0.2.0","environment":"production"}

# Protected route without a token must return 401
curl -s -o /dev/null -w "%{http_code}\n" $API/tracker/rows
# → 401

# Login returns a JWT
curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@i3space.com","password":"<the real password>"}'
# → {"success":true,"message":"Login successful","access_token":"eyJ...","token_type":"bearer","expires_in":604800,"email":"admin@i3space.com"}
```

If the login endpoint returns `500` or the response is missing `access_token`, check Railway logs for the `app_startup` JSON line — `sentry_enabled` and `login_rate_limit` should both appear in it.

---

## 5. Deploy the frontend

```bash
cd frontend
vercel --prod \
  --build-env VITE_API_URL=https://comfortable-patience-production-82bf.up.railway.app \
  --yes
```

Wait ~1 minute, then open the production URL and sign in. Things to verify by eye:

- [ ] Login succeeds with the real credentials.
- [ ] The Board tab loads (no 401s in the browser network panel).
- [ ] Refreshing the page keeps you signed in.
- [ ] Clicking **Sign out** returns you to the login screen and `localStorage` is empty afterwards.

---

## 6. Notify users

Send a one-line note: *"i3 Space backend was upgraded. You'll need to sign in once more — your existing email + password still work."*

The password is the same; only its storage representation changed.

---

## Rotating the JWT secret (force everyone to log out)

Useful if a token may have leaked, if you're rotating credentials, or before transferring ownership.

1. Generate a new value (`python -c "import secrets; print(secrets.token_urlsafe(48))"`).
2. Update `JWT_SECRET` on Railway → **Update Variables** → **Deploy**.
3. Every outstanding token immediately becomes invalid. Users will see one 401 and bounce back to the login screen.

---

## Adding a new user

1. Open `Sheet1` of the credentials spreadsheet.
2. Add a row: column A = email, column B = the temporary plaintext password you'll give the user.
3. Run the migrator to hash the new row:
   ```bash
   cd backend
   source .venv/bin/activate
   python -m scripts.migrate_passwords --apply
   ```
4. Share the email + plaintext password with the user out-of-band.

The migrator only touches plaintext rows, so existing users are untouched.

---

## Resetting a user's password

1. In `Sheet1`, overwrite that user's column B with a new plaintext value.
2. Re-run `python -m scripts.migrate_passwords --apply`.
3. Share the new password with the user.

---

## Standard redeploy (after the cut-over)

```bash
# Backend only
cd backend
RAILWAY_TOKEN=<token> railway up --detach --service f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1

# Frontend only
cd frontend
vercel --prod --build-env VITE_API_URL=https://comfortable-patience-production-82bf.up.railway.app --yes
```

You should never have to repeat steps 1–3 again unless you're rotating `JWT_SECRET` or onboarding new users.

---

## Rollback

If the v0.2 deploy misbehaves badly:

1. Unzip the latest pre-hardening backup into a sibling folder:
   ```bash
   unzip backups/i3-space-backup-pre-prod-hardening-*.zip -d /tmp/i3-rollback
   ```
2. Deploy from that folder:
   ```bash
   cd /tmp/i3-rollback/backend
   RAILWAY_TOKEN=<token> railway up --detach --service f4ebcabb-e99c-4023-b9ae-6f03e0e79bc1
   ```
3. The pre-hardening build accepted plaintext passwords — but the migration in step 3 already hashed them. To roll back fully you'd also need to restore `Sheet1` from a Google Sheets revision (File → Version history → See version history → restore to a version before the migration timestamp).

In practice, the safer move is **roll forward** — fix the bug in v0.2 and redeploy — rather than back-rev to v0.1.

---

## Alternative host migration

If you'd rather not pay $5/mo for Railway Hobby, the backend is portable to any Python host. The two easiest:

### Render free tier (recommended alternative)

- **Pros:** Free, similar one-command deploy, auto-detects Python, free SSL, generous build minutes.
- **Cons:** Cold-start ~30s after 15 min of idle. (Mitigated by an UptimeRobot ping, same as Railway Trial.)
- **Setup (~30 min):**
  1. Push the repo to GitHub (next_steps.md §1 — still pending).
  2. Create a free account at <https://render.com>.
  3. **New → Web Service → Connect repository → Pick `i3-space` → Root directory `backend`.**
  4. Render auto-detects Python and proposes `pip install -r requirements.txt` + `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Accept.
  5. Add the same env vars as the Railway table in [`docs/deployment.md`](deployment.md#environment-variables-set-in-railway-dashboard).
  6. Get the new URL (something like `https://i3-space.onrender.com`).
  7. Redeploy the frontend with `VITE_API_URL=<new url>`.
  8. Update `ALLOWED_ORIGINS` on Render to keep the Vercel URL allowed.

### fly.io free tier

- **Pros:** Free, no cold starts on tiny machines, geographically close to users.
- **Cons:** More CLI setup, requires credit card on file even for free tier, no auto-deploy from git without extra config.
- **Setup:** `brew install flyctl` → `fly auth login` → `fly launch` in `backend/` → `fly secrets set JWT_SECRET=... GOOGLE_CREDENTIALS_JSON='{...}' ...` → `fly deploy`.

For either alternative, the *code* doesn't change — only the host + URL + env-var management UI does. The frontend cut-over is identical (`vercel --prod --build-env VITE_API_URL=<new>`).
