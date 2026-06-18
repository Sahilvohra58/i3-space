# Frontend

## Overview

A React single-page application hosted on Cloudflare Pages. Users authenticate with their i3 Institute Microsoft account ("Sign in with Microsoft") and are shown a dashboard with multiple tabs: a **Board** for cross-tracker analytics and individual input tabs for **YouTube**, **Volunteers** (HR), **Loyalty**, **Outreach**, **Business Enrolled**, **Sponsorships**, **Media Sales**, and **Team**.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 (Vite) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| HTTP client | Axios |
| Auth | `@azure/msal-browser` + `@azure/msal-react` (Microsoft SSO) |
| State | React local state (useState) |
| Charts | Recharts |

---

## Folder Structure

```
frontend/
├── public/
│   └── _redirects                     # Cloudflare Pages SPA routing (/* → /index.html 200)
├── src/
│   ├── auth/
│   │   └── msalConfig.ts              # MSAL PublicClientApplication instance + loginRequest scopes
│   ├── api/
│   │   ├── client.ts                  # Shared axios instance — attaches Azure AD Bearer token on every request
│   │   ├── auth.ts                    # me() — calls GET /auth/me
│   │   ├── tracker.ts                 # YouTube CRUD + channels
│   │   ├── volunteers.ts
│   │   ├── loyalty.ts
│   │   ├── outreach.ts
│   │   ├── business.ts
│   │   ├── sponsorships.ts
│   │   ├── mediaSales.ts
│   │   └── team.ts
│   ├── components/
│   │   ├── board/
│   │   │   ├── StatCard.tsx
│   │   │   ├── DeltaBadge.tsx
│   │   │   ├── MetricKpiGrid.tsx
│   │   │   ├── MiniChartGrid.tsx
│   │   │   ├── MetricIcons.tsx
│   │   │   ├── ViewsBarChart.tsx
│   │   │   ├── MinutesLineChart.tsx
│   │   │   ├── ChannelPieChart.tsx
│   │   │   ├── PlatformFilter.tsx
│   │   │   ├── DateRangeFilter.tsx
│   │   │   ├── volunteers/
│   │   │   │   ├── VolunteerKpiCards.tsx
│   │   │   │   └── VolunteerTrendChart.tsx
│   │   │   └── categories/
│   │   │       ├── CategorySection.tsx
│   │   │       ├── volunteerSpecs.ts
│   │   │       ├── loyaltySpecs.ts
│   │   │       ├── outreachSpecs.ts
│   │   │       ├── businessSpecs.ts
│   │   │       ├── sponsorshipsSpecs.ts
│   │   │       ├── mediaSalesSpecs.ts
│   │   │       └── teamSpecs.ts
│   │   └── tabs/
│   │       ├── BoardTab.tsx
│   │       ├── TrackerTab.tsx
│   │       ├── SnapshotTab.tsx        # Generic CRUD table driven by SnapshotFieldSpec[]
│   │       ├── VolunteersTab.tsx
│   │       ├── LoyaltyTab.tsx
│   │       ├── OutreachTab.tsx
│   │       ├── BusinessTab.tsx
│   │       ├── SponsorshipsTab.tsx
│   │       ├── MediaSalesTab.tsx
│   │       └── TeamTab.tsx
│   ├── hooks/
│   │   ├── useBoardData.ts
│   │   ├── useVolunteerData.ts
│   │   └── useSnapshotData.ts
│   ├── utils/
│   │   ├── metricFormat.ts            # formatMetric / formatDelta by MetricType
│   │   ├── boardCache.ts              # 30-second TTL cache for Board fetches
│   │   ├── csvExport.ts               # RFC 4180 toCsv() + downloadCsv() helpers
│   │   └── hrVolunteerMerge.ts
│   ├── pages/
│   │   ├── LoginPage.tsx              # "Sign in with Microsoft" button (no password form)
│   │   └── DashboardPage.tsx          # Horizontally-scrollable tab bar (9 tabs)
│   ├── App.tsx
│   └── main.tsx                       # MSAL init + MsalProvider wrapper
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## Auth & Session Handling

### MSAL setup (`src/auth/msalConfig.ts`)

```typescript
const msalConfig = {
  auth: {
    clientId: "0b7fb923-f379-4245-b319-a9c1725af4f5",
    authority: "https://login.microsoftonline.com/d1aec0dc-1c2b-4541-9724-3a6f21519d9e",
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: "sessionStorage" },
};
export const msalInstance = new PublicClientApplication(msalConfig);
export const loginRequest = { scopes: ["openid", "profile", "email"] };
```

Tokens are stored in `sessionStorage` (cleared when the browser tab closes). This is intentional for a shared-device scenario — each session starts fresh.

### App bootstrap (`src/main.tsx`)

`msalInstance.initialize()` runs before rendering so MSAL can handle the Microsoft redirect callback synchronously:

```tsx
msalInstance.initialize().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode><MsalProvider instance={msalInstance}><App /></MsalProvider></StrictMode>
  );
});
```

### App state (`src/App.tsx`)

Uses `useIsAuthenticated()` and `useMsal()` from `@azure/msal-react`:

- While `inProgress !== InteractionStatus.None` (redirect in flight) → spinner
- `!isAuthenticated` → `<LoginPage />`
- Authenticated → `<DashboardPage userEmail={accounts[0].username} onLogout={...} />`

Logout calls `instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin })`.

### API request interceptor (`src/api/client.ts`)

```typescript
api.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (account) {
    const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
    config.headers["Authorization"] = `Bearer ${result.idToken}`;
  }
  return config;
});
```

On a 401 response, the interceptor calls `msalInstance.loginRedirect()`. No localStorage management needed — MSAL owns its token cache.

---

## Login Page (`src/pages/LoginPage.tsx`)

Single "Sign in with Microsoft" button (inline Microsoft 4-square SVG logo). Clicking it calls `instance.loginRedirect(loginRequest)`. After Microsoft authenticates the user and redirects back, MSAL handles the token exchange and `useIsAuthenticated()` flips to true automatically.

---

## Dashboard Page

Receives `userEmail` and `onLogout` from `App`. Renders a horizontally-scrollable tab bar with 9 tabs: **Board**, **YouTube Tracker**, **Volunteers Tracker**, **Loyalty**, **Outreach**, **Business Enrolled**, **Sponsorships**, **Media Sales**, **Team**.

---

## Generic Category Architecture

The six business categories + HR all share the same pattern:

| Concern | Reusable | Per-category |
|---|---|---|
| Input table | `SnapshotTab.tsx` (generic CRUD driven by `SnapshotFieldSpec[]`) | `{Category}Tab.tsx` (~20–30 lines) |
| API calls | — | `api/{category}.ts` (3 thin axios calls) |
| KPI derivation | `useSnapshotData.ts` | `useVolunteerData.ts` (thin HR wrapper) |
| Board section | `CategorySection.tsx` + `MetricKpiGrid.tsx` | `{category}Specs.ts` (KPI + chart arrays) |
| Number formatting | `metricFormat.ts` (`MetricType = "count" \| "percent" \| "currency" \| "duration"`) | — |

Adding a new category requires: a `{category}Specs.ts`, a `{Category}Tab.tsx`, an `api/{category}.ts`, and registering the tab in `DashboardPage.tsx`.

---

## Board Tab

The Board aggregates all tracker data. Each section (YouTube + HR + 6 categories) honours a shared date-range filter.

### Board fetch caching

Calls 8 endpoints in parallel on mount. Fetches are wrapped in a 30-second TTL cache (`utils/boardCache.ts`). A manual **Refresh** button calls `invalidate()`. Snapshot tabs also call `invalidate()` after successful add/delete.

### Optimistic mutations

- **Add**: compute `row_index = max(currentIndices) + 1`, append locally, invalidate Board cache.
- **Delete**: filter the row out of local state immediately; on error, restore the saved snapshot.

### CSV export

Every input tab has an **Export CSV** button. Generates RFC 4180-compliant CSV in-browser (no backend call) via `utils/csvExport.ts`. Uses raw field keys as headers and raw numeric values. Filename: `<slugified-title>-YYYY-MM-DD.csv`.

---

## API Contracts

### Auth
```
GET /auth/me    → { email, name, oid }
```

### YouTube Tracker
```
GET    /tracker/rows            → TrackerRow[]
POST   /tracker/rows            → 201 Created
DELETE /tracker/rows/{index}    → 204 No Content
GET    /tracker/channels        → string[]
```

### Category trackers
```
GET    /<category>/snapshots          → Snapshot[]
POST   /<category>/snapshots          → 201 Created
DELETE /<category>/snapshots/{index}  → 204 No Content
```

---

## Build & Deploy

Connected to GitHub via Cloudflare Pages. Push to `main` → automatic build and deployment. No manual steps required.

Build settings (configured in Cloudflare Pages dashboard):
- Build command: `npm run build`
- Build output: `dist/`
- Root directory: `frontend/`
- Env var: `VITE_API_URL=https://i3space-backend.whitepond-61860c90.canadacentral.azurecontainerapps.io`

Local development:

```bash
cd frontend
npm install
# create .env.local with: VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Future Work

See `docs/tech-debt.md` for the full list. Key frontend items:

- Sentry (`@sentry/react`) — backend is already instrumented
- Vitest + React Testing Library test suite
- React Router for deep-linking to specific tabs
- Multi-platform tracker (Instagram, Twitter, TikTok)
- Board date range picker and drill-down
- Board CSV export
- Delete `LoginForm.tsx` (unused since MSAL login replaced it) and `src/api/session.ts` (localStorage token helpers, no longer needed)
