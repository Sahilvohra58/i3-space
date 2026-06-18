# Deployment Guide

## Overview

| Layer | Platform | URL |
|---|---|---|
| Frontend (React/Vite) | Cloudflare Pages | https://i3-space.pages.dev |
| Backend (FastAPI) | Azure Container Apps | https://i3space-backend.whitepond-61860c90.canadacentral.azurecontainerapps.io |

---

## Architecture

```
User Browser
    │  Sign in with Microsoft (MSAL)
    │  Authorization: Bearer <Azure AD ID token>
    ▼
Cloudflare Pages (frontend)           ← static React/Vite build, global CDN
    │   HTTPS + Bearer token on every request
    ▼
Azure Container Apps (backend)        ← FastAPI, Uvicorn, port 8080
    │   • VNet-integrated (VNET1 / container-apps subnet)
    │   • Validates Azure AD RS256 ID tokens via JWKS
    │   • JSON logs with X-Request-ID
    │   private TCP (port 5432)
    ▼
Azure PostgreSQL Flexible Server      ← VNet-only (VNET1 / default subnet)
    │   Host: i3-postgressqldb.postgres.database.azure.com
    │   Database: i3space
    │   NO public network access — reachable only from within VNET1
```

---

## Authentication

All auth is handled by **Azure AD (Microsoft Entra ID)** — there is no username/password login.

### Login flow

1. Frontend calls `msalInstance.loginRedirect()` → user authenticates with their i3 Institute Microsoft account.
2. Microsoft issues an ID token (RS256) to the browser.
3. MSAL stores the token in `sessionStorage`; the axios request interceptor calls `acquireTokenSilent()` to attach it as `Authorization: Bearer <id-token>` on every API call.
4. Backend validates the token via the Azure AD JWKS endpoint (`https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys`), checking audience, issuer, and expiry.
5. Any `401` response triggers `msalInstance.loginRedirect()` — the user is bounced back through Microsoft login.

### Access control

Only users explicitly added to the **i3space-app** Enterprise Application can sign in. Everyone else is blocked by Microsoft before reaching the app.

See [adding-users.md](adding-users.md) for how to add/remove users.

### What's protected

| Endpoint | Auth required? |
|---|---|
| `GET /healthz`, `GET /health` | No |
| `GET /auth/me` | Yes — returns `{email, name, oid}` from Azure AD token claims |
| All data routes (`/tracker`, `/volunteers`, `/loyalty`, `/outreach`, `/business`, `/sponsorships`, `/media-sales`, `/team`) | **Yes** |

---

## CI/CD

### Backend — GitHub Actions + ACR

Any push to `main` that touches `backend/**` triggers `.github/workflows/deploy-backend.yml`:

1. Builds a Docker image from `backend/Dockerfile`.
2. Pushes it to ACR as `i3spacecr.azurecr.io/i3space-backend:latest`.

After the push, **run locally** to deploy the new image to Container Apps:

```bash
az containerapp update \
  --name i3space-backend \
  --resource-group rg-shared-prod \
  --image i3spacecr.azurecr.io/i3space-backend:latest
```

> **Why the manual step?** Sahil is Contributor on `rg-shared-prod`, not Owner, so the GitHub Actions service principal can't be granted the Contributor role needed for Container Apps deployment. Once Mujtaba grants the role (or sets up Continuous Deployment in the portal), this step can be automated. See `docs/tech-debt.md`.

#### Required GitHub Actions secrets

| Secret | Value |
|---|---|
| `ACR_USERNAME` | ACR admin username (from Azure Portal → i3spacecr → Access keys) |
| `ACR_PASSWORD` | ACR admin password (same page) |

### Frontend — Cloudflare Pages (GitHub connected)

The Cloudflare Pages project is connected directly to the GitHub repo. Every push to `main` that touches `frontend/**` triggers an automatic build and deployment — no manual step needed.

Build settings in Cloudflare Pages dashboard:
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `frontend`
- **Environment variable:** `VITE_API_URL=https://i3space-backend.whitepond-61860c90.canadacentral.azurecontainerapps.io`

---

## Backend — Container App details

| Setting | Value |
|---|---|
| Container App name | `i3space-backend` |
| Resource group | `rg-shared-prod` |
| Region | Canada Central |
| Image | `i3spacecr.azurecr.io/i3space-backend:latest` |
| Ingress | External, port 8080 |
| Min replicas | 0 (scales to zero when idle) |

### Environment variables (set in Container App secrets/env)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✓ | `postgresql://user:pass@i3-postgressqldb.postgres.database.azure.com/i3space` — kept in Container App secrets |
| `AZURE_AD_TENANT_ID` | ✓ | `d1aec0dc-1c2b-4541-9724-3a6f21519d9e` |
| `AZURE_AD_CLIENT_ID` | ✓ | `0b7fb923-f379-4245-b319-a9c1725af4f5` |
| `ALLOWED_ORIGINS` | ✓ | `https://i3-space.pages.dev,http://localhost:5173` |
| `ALLOW_PAGES_PREVIEWS` | – | `true` (default) — allows any `*.pages.dev` origin. Set to `false` once a custom domain is used. |
| `INITIAL_USER_EMAIL` | – | Seeds the first user row in PostgreSQL on cold start if the `users` table is empty. Unused after first start. |
| `INITIAL_USER_PASSWORD` | – | Paired with `INITIAL_USER_EMAIL`. |
| `LOG_LEVEL` | – | `INFO` (default) |
| `APP_ENV` | – | `production` |
| `APP_VERSION` | – | `0.3.0` |
| `SENTRY_DSN` | – | Leave unset to disable Sentry |
| `LOGIN_RATE_LIMIT` | – | `5/minute` (default) — legacy guard; no `/auth/login` endpoint exists anymore |

To update: Azure Portal → Container Apps → `i3space-backend` → Environment variables → Edit → Save → Create new revision.

### Health endpoints

| Endpoint | Response |
|---|---|
| `GET /healthz` | `{"status":"ok","version":"0.3.0","environment":"production"}` |
| `GET /health` | `{"status":"ok"}` (legacy alias) |

```bash
BASE=https://i3space-backend.whitepond-61860c90.canadacentral.azurecontainerapps.io
curl "$BASE/healthz"
```

---

## Frontend — Cloudflare Pages details

| Field | Value |
|---|---|
| Project name | `i3-space` |
| Account | Sahil@i3institute.ca's Account (`7f4d7445fc8a8d69af528bec10ef6d02`) |
| Production URL | https://i3-space.pages.dev |
| Dashboard | https://dash.cloudflare.com/7f4d7445fc8a8d69af528bec10ef6d02/pages/view/i3-space |
| GitHub repo | `Sahilvohra58/i3-space`, branch `main` |

---

## Database

**PostgreSQL Flexible Server** — VNet-private only. No public access is enabled and it must stay that way.

| Setting | Value |
|---|---|
| Server name | `i3-postgressqldb.postgres.database.azure.com` |
| Database | `i3space` |
| VNet | `VNET1`, subnet `default` |
| Public access | **Disabled** |

Tables created automatically on startup: `users`, `channels`, `tracker_rows`, `business_snapshots`, `loyalty_snapshots`, `outreach_snapshots`, `sponsorship_snapshots`, `media_sales_snapshots`, `team_snapshots`, `volunteer_snapshots`.

---

## Tokens & secrets

Sensitive credentials are stored in **Azure Container Apps secrets** (visible in the Azure portal under `i3space-backend → Secrets`). Non-sensitive reference info:

| Key | Value |
|---|---|
| `CF_ACCOUNT_ID` | `7f4d7445fc8a8d69af528bec10ef6d02` |
| `CF_PAGES_PROJECT_NAME` | `i3-space` |
| `AZURE_AD_TENANT_ID` | `d1aec0dc-1c2b-4541-9724-3a6f21519d9e` |
| `AZURE_AD_CLIENT_ID` | `0b7fb923-f379-4245-b319-a9c1725af4f5` |
| ACR login server | `i3spacecr.azurecr.io` |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Need admin approval" on login | Mujtaba hasn't completed one-time admin consent | Share the consent URL from `adding-users.md` with Mujtaba |
| "You don't have access" on login | User not assigned in Enterprise App | Azure Portal → Enterprise Apps → i3space-app → Users and groups → Add |
| `401 {"detail": "Invalid or expired token"}` | Azure AD token expired or audience mismatch | Sign out and sign back in; check `AZURE_AD_CLIENT_ID` and `AZURE_AD_TENANT_ID` env vars |
| `401 {"detail": "Missing bearer token"}` | Axios interceptor failed to attach token | Check browser console for MSAL errors; try signing out and back in |
| CORS error in browser | Frontend origin not in `ALLOWED_ORIGINS` | Update the Container App env var to include the new origin |
| Backend returns 502 | Container App crash on startup | Check Container App logs: Azure Portal → i3space-backend → Log stream |
| Container App shows old code | Forgot the `az containerapp update` step after CI push | Run `az containerapp update --name i3space-backend --resource-group rg-shared-prod --image i3spacecr.azurecr.io/i3space-backend:latest` |
| Frontend shows old version after push | Cloudflare Pages build failed | Check Cloudflare Pages dashboard for build errors |
