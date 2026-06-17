# Frontend Plan

## Overview

A React single-page application that provides a login screen and a post-login dashboard. The user enters their email and password, which are sent to the backend for validation. On success the user is shown a dashboard with multiple tabs: a **Board** for cross-tracker analytics and individual input tabs — **YouTube**, **Volunteers** (Human Resources), **Loyalty**, **Outreach**, **Business Enrolled**, **Sponsorships**, **Media Sales**, and **Team**. On failure a clear error message is displayed.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 (Vite) | Fast dev server, minimal boilerplate |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS | Utility-first, rapid UI iteration |
| HTTP client | Axios | Clean API, interceptor support |
| Form handling | React Hook Form | Lightweight, easy validation |
| State | React local state (useState) | Simple enough for now; can swap to Zustand/Redux later |
| Charts | Recharts | Composable React charting library, good TypeScript support |

---

## Folder Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts                  # Shared axios instance + Bearer-token + 401 interceptors
│   │   ├── session.ts                 # localStorage helpers (getToken, saveSession, clearSession, UNAUTHORIZED_EVENT)
│   │   ├── auth.ts                    # login() + me(); persists token via session.ts
│   │   ├── tracker.ts                 # YouTube CRUD + channels
│   │   ├── volunteers.ts              # Volunteers snapshot CRUD
│   │   ├── loyalty.ts
│   │   ├── outreach.ts
│   │   ├── business.ts
│   │   ├── sponsorships.ts
│   │   ├── mediaSales.ts
│   │   └── team.ts
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── board/
│   │   │   ├── StatCard.tsx               # KPI card (label + value + sub-node)
│   │   │   ├── DeltaBadge.tsx             # Δ vs prev, colour-coded by direction
│   │   │   ├── MetricKpiGrid.tsx          # Generic grid of StatCards (uses DeltaBadge)
│   │   │   ├── MiniChartGrid.tsx          # Generic grid of Recharts line minicharts
│   │   │   ├── MetricIcons.tsx            # SVG icon library (Heart, Dollar, …)
│   │   │   ├── ViewsBarChart.tsx          # YouTube-specific bar chart
│   │   │   ├── MinutesLineChart.tsx       # YouTube-specific line chart
│   │   │   ├── ChannelPieChart.tsx        # YouTube-specific pie chart
│   │   │   ├── PlatformFilter.tsx
│   │   │   ├── DateRangeFilter.tsx
│   │   │   ├── volunteers/
│   │   │   │   ├── VolunteerKpiCards.tsx  # HR Board section: 3 metric groups via MetricKpiGrid
│   │   │   │   └── VolunteerTrendChart.tsx # 8-metric trend grid via MiniChartGrid
│   │   │   └── categories/
│   │   │       ├── CategorySection.tsx    # Reusable Section: title + KPI grid + chart grid
│   │   │       ├── volunteerSpecs.ts      # HR fields + VOLUNTEER/ENGAGEMENT/PROCESS KPIs + charts
│   │   │       ├── loyaltySpecs.ts        # LOYALTY_KPIS + LOYALTY_CHARTS
│   │   │       ├── outreachSpecs.ts
│   │   │       ├── businessSpecs.ts
│   │   │       ├── sponsorshipsSpecs.ts
│   │   │       ├── mediaSalesSpecs.ts
│   │   │       └── teamSpecs.ts
│   │   └── tabs/
│   │       ├── BoardTab.tsx               # Aggregated dashboard, all sources
│   │       ├── TrackerTab.tsx             # YouTube input table
│   │       ├── VolunteersTab.tsx          # ~20-line wrapper around SnapshotTab (HR tracker)
│   │       ├── SnapshotTab.tsx            # Generic input table (used by all 6 categories)
│   │       ├── LoyaltyTab.tsx             # ~30-line wrapper around SnapshotTab
│   │       ├── OutreachTab.tsx
│   │       ├── BusinessTab.tsx
│   │       ├── SponsorshipsTab.tsx
│   │       ├── MediaSalesTab.tsx
│   │       └── TeamTab.tsx
│   ├── hooks/
│   │   ├── useBoardData.ts                # Derives YouTube chart data
│   │   ├── useVolunteerData.ts            # Thin wrapper over useSnapshotData for HR metrics
│   │   └── useSnapshotData.ts             # Generic: derives KPIs + deltas for any category
│   ├── utils/
│   │   ├── metricFormat.ts                # formatMetric / formatDelta by MetricType
│   │   ├── boardCache.ts                  # 30-second TTL cache for Board fetches
│   │   └── csvExport.ts                   # RFC 4180 toCsv() + downloadCsv() helpers
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── DashboardPage.tsx              # Horizontally-scrollable tab bar (9 tabs)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

### Generic category architecture

The six business categories (Loyalty, Outreach, Business, Sponsorships, Media Sales, Team) share an extracted architecture so adding a new category is small. **Human Resources** (`volunteers_tracker`) follows the same pattern — it uses `SnapshotTab` for input and `volunteerSpecs.ts` for Board KPI/chart definitions, but keeps dedicated Board components (`VolunteerKpiCards`, `VolunteerTrendChart`) because it renders three labelled metric groups instead of a single `CategorySection`.

| Concern | Reusable component | Per-category file |
|---|---|---|
| Input table | `tabs/SnapshotTab.tsx` (generic CRUD UI driven by a `SnapshotFieldSpec[]`) | `tabs/{Category}Tab.tsx` (~20–30 lines, passes the field spec) |
| Data fetching | `api/{category}.ts` (3 thin axios calls) | One per category |
| KPI derivation | `hooks/useSnapshotData.ts` (computes value + delta for each metric key) | `hooks/useVolunteerData.ts` (thin wrapper for HR) |
| Board section | `components/board/categories/CategorySection.tsx` (title + KPI grid + chart grid + empty state) | `components/board/categories/{category}Specs.ts` (`*_KPIS` + `*_CHARTS` arrays) |
| HR Board section | `VolunteerKpiCards.tsx` + `VolunteerTrendChart.tsx` (three metric groups) | `components/board/categories/volunteerSpecs.ts` |
| KPI rendering | `components/board/MetricKpiGrid.tsx` + `MetricIcons.tsx` + `DeltaBadge.tsx` | — |
| Charts | `components/board/MiniChartGrid.tsx` | — |
| Number formatting | `utils/metricFormat.ts` (`MetricType = "count" \| "percent" \| "currency" \| "duration"`) | — |

---

## Login Page Behaviour

1. User lands on `/` (only route — no React Router yet; state-gated).
2. They fill in **Email** and **Password**.
3. On submit the form is validated client-side (non-empty, valid email format).
4. A `POST /auth/login` request is fired with `{ email, password }`.
5. **Success (HTTP 200)** → calls `onLoginSuccess(email)` → App shows Dashboard.
6. **Failure (HTTP 401)** → show "Invalid credentials" inline error.
7. **Network / server error** → show generic "Something went wrong" error.

---

## Dashboard Page

- Receives `userEmail` and `onLogout` props from `App`.
- Renders a top navigation with input tabs (**YouTube Tracker**, **Volunteers Tracker**, …) plus the **Board** tab.
- Active tab state is local (`useState`).
- The nav bar uses horizontal scrolling so additional category tabs can be added without breaking layout.

### Board Tab

The Board is the cross-platform analytics overview. It aggregates data from all tracker tabs (YouTube today; Instagram, Twitter, etc. in the future) and displays it as interactive charts and summary KPIs.

#### Data model

Each tracker produces rows with a shared shape that the Board can consume:

```typescript
interface TrackerEntry {
  platform: "youtube" | "instagram" | "twitter"; // extensible
  date: string;           // ISO date string, e.g. "2026-04-13"
  channel_name: string;   // channel / account name
  views: number;          // view / impression count
  minutes_watched: number;// watch time in minutes (YouTube) or equivalent
}
```

When new platforms are added they emit the same interface so the Board needs no structural changes — only new `platform` values and their own tracker tabs.

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Platform filter:  [All]  [YouTube]  [Instagram]  [Twitter] │
├───────────┬───────────┬───────────┬─────────────────────┤
│ Total     │ Total     │ Channels  │ Date range          │
│ Views     │ Min.Watch │ Tracked   │ (first → latest)    │
├───────────┴───────────┴───────────┴─────────────────────┤
│  Views by Channel (Bar chart, horizontal)               │
│                                                          │
├──────────────────────────┬───────────────────────────────┤
│  Views over Time         │  Channel Share               │
│  (Line chart)            │  (Pie / Donut chart)         │
└──────────────────────────┴───────────────────────────────┘
```

#### Components

| Component | Chart type | X-axis / grouping | Y-axis / value | Notes |
|---|---|---|---|---|
| `StatCard` | — | — | Single KPI | Reusable; shows icon, label, formatted number |
| `ViewsBarChart` | Horizontal bar | Channel name | Total views | Sorted descending; one bar per channel |
| `MinutesLineChart` | Line (multi-series) | Date | Minutes watched | One line per platform/channel; dot markers |
| `ChannelPieChart` | Donut | Channel name | Share of total views | Tooltip with absolute + % values |

#### Behaviour

- **Platform filter**: pill buttons at the top. "All" is selected by default. Selecting a platform filters all charts and KPI cards simultaneously.
- **Empty state**: if no data exists for the active filter, each chart shows a friendly "No data yet" placeholder instead of an empty chart.
- **Data freshness**: the Board fetches rows from `GET /tracker/rows` (and future `/instagram/rows`, etc.) on mount; a manual **Refresh** button re-fetches without a full page reload.
- **Responsive**: KPI cards stack to 2 columns on mobile; charts stack vertically below the fold.

#### `useBoardData` hook

Encapsulates all derivation logic so components stay pure:

```typescript
// Input: raw TrackerEntry[] from all platforms
// Output:
{
  kpis: { totalViews, totalMinutes, channelCount, dateRange };
  barData: { channel_name, views }[];          // for ViewsBarChart
  lineData: { date, [channel]: minutes }[];    // for MinutesLineChart
  pieData: { name, value }[];                  // for ChannelPieChart
}
```

### YouTube Tracker Tab

| Column | Type | Notes |
|---|---|---|
| Date | string (date input) | e.g. 2026-04-10 |
| Channel Name | select dropdown | Options fetched from `GET /tracker/channels` (stored in `channels` sheet) |
| Views | number | Integer only; blocks decimals and non-numeric keys |
| Minutes Watched | number | Integer only; blocks decimals and non-numeric keys |
| Actions | — | Delete button per row |

- On mount: `GET /tracker/rows` populates the table.
- **Add Entry** button opens an inline form row at the top; on submit calls `POST /tracker/rows` and refreshes.
- **Delete** (trash icon) on each row calls `DELETE /tracker/rows/{row_index}` and refreshes.
- Optimistic UI: row is removed from the table immediately, rolled back on error.

### Human Resources Tracker Tab (nav label: **Volunteers**)

Title in the tab UI: **Human Resources Tracker**. Uses the shared `SnapshotTab` component driven by `VOLUNTEER_FIELDS` from `volunteerSpecs.ts`.

| Column | Type | Notes |
|---|---|---|
| Date | string (date input) | Period/snapshot date |
| Active Volunteers | integer | Current head-count of active volunteers |
| Avg Time to Fill (days) | integer | Mean days to fill a vacancy this period |
| Churn Count | integer | Volunteers lost in this period |
| NPS Score | float | Net Promoter Score (−100 to 100; `min: -100` on the field spec) |
| Training Participation | float (%) | Share of volunteers who completed training |
| Roles with Defined KPIs | float (%) | Share of roles with documented KPIs |
| Performance Review Completion | float (%) | Share of reviews completed on time |
| Mentorship Participation | float (%) | Share of volunteers in mentorship programmes |
| Actions | — | Delete button per row |

- On mount: `GET /volunteers/snapshots` populates the table.
- **Add Snapshot** form uses the same inline UX as other category tabs.
- Optimistic add/delete with rollback on error; calls `invalidateBoardCache()` after mutations.
- Snapshots are sorted **newest-first** for display.
- **Export CSV** includes all eight metric keys.

### Board → Human Resources section

Rendered as a dedicated section on the Board tab (below YouTube charts). Uses the same date-range filter as other Board sections. Nav tab for data entry is still labelled **Volunteers**.

Three metric groups, each rendered via `MetricKpiGrid`:

| Group | Metrics | Delta behaviour |
|---|---|---|
| Volunteer Metrics | Active Volunteers · Avg Time to Fill · Churn | Up is good for *active volunteers*; down is good for *time-to-fill* and *churn* |
| Engagement Metrics | NPS Score · Training Participation | Up is good for both |
| Process Metrics | Roles with KPIs · Review Completion · Mentorship Participation | Up is good for all three |

| Component | Display |
|---|---|
| `VolunteerKpiCards` | Three labelled KPI grids (8 cards total) with `DeltaBadge` vs. previous snapshot |
| `VolunteerTrendChart` | Eight line charts in a 4-column grid via `MiniChartGrid` + `VOLUNTEER_CHARTS` |

The `useVolunteerData` hook delegates to `useSnapshotData` with the eight keys from `VOLUNTEER_METRIC_KEYS`, so chart components stay presentational.

---

## API Contracts (consumed by frontend)

### Auth
```
POST /auth/login    → { success, message }
```

### YouTube Tracker
```
GET    /tracker/rows            → TrackerRow[]
POST   /tracker/rows            → 201 Created
DELETE /tracker/rows/{index}    → 204 No Content
GET    /tracker/channels        → string[]
```

```typescript
interface TrackerRow {
  row_index: number;
  date: string;
  channel_name: string;
  views: number;
  minutes_watched: number;
}
```

### Human Resources Tracker (`/volunteers/snapshots`)

```
GET    /volunteers/snapshots          → VolunteerSnapshot[]
POST   /volunteers/snapshots          → 201 Created
DELETE /volunteers/snapshots/{index}  → 204 No Content
```

```typescript
interface VolunteerSnapshot {
  row_index: number;
  date: string;
  active_volunteers: number;
  avg_time_to_fill_days: number;
  churn_count: number;
  nps_score: number;
  training_participation_rate: number;
  roles_with_kpis_rate: number;
  performance_review_completion_rate: number;
  mentorship_participation_rate: number;
  [key: string]: number | string; // index signature for useSnapshotData compatibility
}
```

### Business category trackers (Loyalty, Outreach, Business, Sponsorships, Media Sales, Team)

All six follow the same snapshot pattern:

```
GET    /<category>/snapshots          → CategorySnapshot[]
POST   /<category>/snapshots          → 201 Created
DELETE /<category>/snapshots/{index}  → 204 No Content
```

Each category gets its own input tab and a Board section. All sections honour the shared date-range filter.

### Board fetch caching

The Board calls 8 endpoints in parallel on mount. To stay under Google Sheets' 60-read/min/user limit, fetches are wrapped in a module-level TTL cache (`utils/boardCache.ts`, 30 s). The manual **Refresh** button calls `invalidate()` so the user can always force a fresh read. Snapshot tabs also call `invalidate()` after successful add/delete so the next Board visit sees fresh data.

### Optimistic snapshot mutations

To avoid an extra Google Sheets read after every CRUD action, the snapshot tabs (`SnapshotTab`-driven category tabs including **Volunteers**/HR, plus `TrackerTab`) update local state optimistically:

- **Add**: compute `row_index = max(currentIndices) + 1` (the sheet always appends at the end), append locally, then `invalidateBoardCache()`. The next mount sees authoritative data.
- **Delete**: filter the row out of local state, then `DELETE`; on failure, restore the saved snapshot.

### CSV export

Every input tab (`TrackerTab`, the **Volunteers** (HR) tab, and all six `SnapshotTab`-driven category tabs) has an **Export CSV** button next to **Add Snapshot**. It:

- Generates an RFC 4180-compliant CSV in-browser (no backend call) via `utils/csvExport.ts`.
- Uses raw field **keys** (e.g. `customer_retention_rate`, `avg_clv`) as headers — analytics-friendly, never display labels.
- Writes raw numeric values (no `$`/`%`/`,` formatting) so the file imports cleanly into Excel / Sheets / pandas.
- Filename: `<slugified-title>-YYYY-MM-DD.csv` (e.g. `loyalty-and-partnership-tracker-2026-05-16.csv`).
- UTF-8 with BOM so Excel auto-detects encoding.
- Disabled when the table is empty.

---

## Auth & session handling

A single axios instance (`src/api/client.ts`) is shared by every `api/*.ts`
module. It has two interceptors:

- **Request interceptor** — reads the bearer token from `getToken()` (a thin
  wrapper around `localStorage`) and adds it to `Authorization` on every call.
- **Response interceptor** — on any `401`, calls `clearSession()` and emits a
  global `i3:unauthorized` `CustomEvent`. `App.tsx` listens for it and bounces
  the user back to the login screen.

Session storage (`src/api/session.ts`) keeps three keys in `localStorage`:

| key                          | contents                              |
|------------------------------|---------------------------------------|
| `i3.access_token`            | The signed JWT returned by login      |
| `i3.email`                   | The user's email (for the header)     |
| `i3.token_expires_at_ms`     | UNIX ms when the token expires        |

`App.tsx` has three states: `loading | anonymous | authenticated`.

1. On mount, if a session is present (`getSession()` returns non-null and
   `expiresAtMs > now + 30s`), it calls `GET /auth/me` to verify the token is
   still valid server-side. If valid, the user lands directly on the Dashboard
   — no login round-trip needed.
2. If the token is missing, expired, or rejected, `clearSession()` is called
   and the login form renders.
3. Any subsequent `401` (e.g. token expired mid-session, or `JWT_SECRET` was
   rotated) is caught by the axios interceptor → `i3:unauthorized` fires →
   `App.tsx` resets state → login form re-appears.

> **Security note:** `localStorage` is XSS-readable, which is an acceptable
> trade-off for a small internal tool deployed under HTTPS-only origins. For a
> public-facing app we'd move tokens into `HttpOnly; Secure` cookies and add a
> CSRF token on POST/DELETE.

---

## Future Considerations

- **More platforms**: Add Instagram, Twitter, TikTok tracker tabs; Board auto-aggregates via `useBoardData`.
- **Board date range picker**: Let the user filter charts by a custom date window.
- **Board drill-down**: Click a bar/slice to filter the other charts to that channel.
- **Inline row editing**: Double-click a tracker row to edit it in place.
- **Board CSV export**: A single button on the Board to dump all aggregated KPIs across categories for the active date range.
- **React Router**: Add protected `/dashboard` route and refresh tokens so JWTs can be short-lived.
- **HttpOnly cookies**: Move the token out of `localStorage` once we have a stable backend domain.
- **Frontend Sentry**: wire `@sentry/react` (DSN: `VITE_SENTRY_DSN`) to catch JS-side errors.
- **Unit tests**: Vitest + React Testing Library for components; test `useBoardData` derivation logic in isolation.
- **Storybook**: Isolated component development for `StatCard`, chart wrappers, etc.
