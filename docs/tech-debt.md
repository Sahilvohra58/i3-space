# Tech Debt

Outstanding work items ordered by priority.

---

## Security

### Rotate Cloudflare API token

The active Cloudflare Pages API token was exposed in shell history during setup and must be rotated. Generate a replacement:

1. [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → "Edit Cloudflare Pages" template
2. Scope to `i3-space` project
3. Update the token in GitHub Actions secrets if it's stored there (check repo Settings → Secrets)
4. Revoke the old token

### Container App auto-deploy (Contributor role)

Currently CI pushes to ACR but deploying to Container Apps requires a manual `az containerapp update` locally. This is because Sahil is Contributor, not Owner, on `rg-shared-prod` — so the GitHub Actions service principal can't be granted the Contributor role needed.

Options:
- Ask Mujtaba (Owner) to grant the service principal Contributor on `rg-shared-prod`
- Or: Azure Portal → i3space-backend → Settings → Continuous deployment → connect GitHub repo directly (portal handles the role assignment internally)

---

## Observability

### Sentry — frontend

Backend Sentry hook is already wired (`SENTRY_DSN` env var activates it). Frontend is not instrumented yet.

```bash
cd frontend
npm install @sentry/react
```

Then init in `main.tsx` with `VITE_SENTRY_DSN`. Add `VITE_SENTRY_DSN` to Cloudflare Pages environment variables.

### Structured log shipping

Backend emits JSON logs to stdout. Currently only visible via Azure Portal → i3space-backend → Log stream. To retain and search logs:

- Set up **Azure Log Analytics workspace** linked to the Container Apps environment, or
- Forward to **BetterStack** (free 1 GB/mo) via the Container App logging configuration

---

## Infrastructure

### Custom domain — `space.i3institute.ca`

Target domain is `space.i3institute.ca`. DNS is managed by IT (likely GoDaddy — `i3institute.ca` is not in Cloudflare). Waiting on IT DNS access.

#### DNS record to add in GoDaddy

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `space` | `i3-space.pages.dev` | 1 hour |

#### Order of operations (matters)

1. **Cloudflare Pages first** → `i3-space` project → Custom domains → Add `space.i3institute.ca` (Cloudflare starts waiting for the CNAME)
2. **Then add the CNAME in GoDaddy**
3. Cloudflare auto-provisions an SSL cert once it detects the record (a few minutes, up to an hour)

#### After the domain is live

4. Azure Portal → App Registration `i3space-app` → Authentication → add `https://space.i3institute.ca` as a redirect URI (SPA)
5. Container App → update `ALLOWED_ORIGINS` to include `https://space.i3institute.ca`, then create a new revision
6. Set `ALLOW_PAGES_PREVIEWS=false` once stable
7. Update `docs/deployment.md` with the new URL

---

## Code quality

### Backend tests

No automated tests exist. Minimum viable test suite:

- `GET /healthz` returns 200
- `GET /auth/me` without token → 401
- `GET /auth/me` with a valid mock Azure AD token → 200
- Each data router `GET` endpoint returns 200 with a valid token

Stack: `pytest` + `httpx` (test client) + mock for `validate_azure_token`.

### Frontend tests

No automated tests exist. Suggested tooling: Vitest + React Testing Library.

Priority:
- `useSnapshotData` hook — pure derivation logic, easy to unit-test
- `useBoardData` hook
- `SnapshotTab` — render, add, delete flows

---

## Features

### Multi-platform tracker

The Board is designed to aggregate multiple platforms (YouTube, Instagram, Twitter, TikTok) but only YouTube is implemented. Each new platform needs:
- A backend router + DB service
- A frontend tab + API module
- Entries in `useBoardData` and `PlatformFilter`

### Board enhancements

- Date range picker (custom window instead of first→latest)
- Drill-down: click a bar/slice to filter the other charts to that channel
- Inline row editing (double-click a tracker row)
- Board CSV export (dump all KPIs across categories for the active date range)

### React Router

Currently the app uses state-gating (no URL routing). Adding React Router would enable:
- Deep-linking to a specific tab
- A proper `/dashboard` protected route
- Cleaner history management

### Privacy policy

The app collects Microsoft account email and all tracker entries. A one-page privacy + terms doc is needed before sharing the app externally.

Add `/privacy` and `/terms` static routes on the frontend; link from the dashboard footer.

---

## Won't do / closed

These items from earlier planning are no longer relevant:

| Item | Why closed |
|---|---|
| Bcrypt password migration script | Google Sheets auth is gone; auth is now Azure AD |
| JWT secret rotation | No HS256 JWTs issued; Azure AD handles token lifecycle |
| Google Sheets backups | Sheets are no longer used; PostgreSQL has Azure-managed backups |
| Railway upgrade / migration | Migrated to Azure Container Apps |
| Move secrets out of Google Sheet | Secrets now live in Azure Container App secrets store |
| UptimeRobot / cold-start mitigation | Still somewhat relevant (Container App scales to zero); low priority since Azure cold starts are fast |
| User management UI | Azure AD Enterprise Application "Users and groups" handles this |
