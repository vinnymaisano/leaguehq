# CLAUDE.md

Guidance for working in this repo. LeagueHQ is a web app for managing **dynasty fantasy
football contracts & salary caps** on top of **Sleeper** leagues (import drafts as
contracts, extend/edit contracts, run trades, manage members, subscriptions).

## Stack & layout
Single root `package.json` (ESM, `"type": "module"`) drives both halves:
- **Frontend**: React 19 + Vite 6 + React Router 7, in `frontend/` (Vite `root` is `frontend/`). Plain CSS (no framework) in `frontend/src/css/`.
- **Backend**: Express 5 + Mongoose 8 (MongoDB), in `backend/`. Entry `backend/server.js` (port 5000).
- Payments via Stripe, auth via JWT in cookies, Redis (ioredis) available.

## Commands (run from repo root)
- `npm run dev` — Vite dev server (port 5173). Proxies `/api` and `/auth` → `http://localhost:5000`.
- `npm run server` — backend with nodemon.
- `npm run test` — runs both concurrently (this is the "run everything" script; there is **no unit test suite**).
- `npm run build` — `vite build`. **Use this to verify frontend changes compile** (build outDir is `/var/www/leaguehq` in config; output paths in logs are fine to ignore locally).
- `npm run lint` — eslint.
- Backend has no compile step; sanity-check with `node --check <file>`.

## Backend architecture
Layered: **router → controller → service → model**.
- `backend/routers/league_router.js` — most routes are under `/api` (mounted in `server.js`). Auth routes in `auth_router.js`.
- `backend/controllers/league_controller.js` — thin; parse `req`, call a service, map errors via `err.statusCode`.
- `backend/services/league_service.js` — **all business logic + DB access lives here** (large file).
- `backend/models/` — `League`, `User`, `Contracts`, `Player`, `Subscription`, `Transaction`. All use `timestamps: true`.
- Middleware `backend/middleware/verify_token.js` sets `req.user.user_id` from the JWT cookie.
- **Permission helper**: `verify_commissioner(league, user)` in `league_service.js` → owner or commissioner. Reuse it for any commissioner-gated mutation (settings, rename, member edits).

### Key domain facts
- A League stores `sleeper_league_ids` as a **Map of year → Sleeper league id** (one per season; dynasty leagues get a new Sleeper id each year). `Math.max(...keys)` = current season.
- **League name**: the display name is fetched **live from Sleeper** and set as `league.name` in `fetch_league` (single, `toObject()`) and `fetch_multiple_leagues` (list, `.lean()`). `custom_name` is a persisted League field (optional, commissioner-set) that overrides it — never overwrite the Sleeper name.
- **Subscription status**: `fetch_multiple_leagues` computes `subscription_status` ("active" | "trial" | "inactive") DB-only from `Subscription` docs (by season window) + `free_trial_end`. In-app, `LeagueContext` derives `subStatus`/`subPurchased` via `is_subscription_active(league, subHistory)` in `frontend/src/utils/utils.js`.
- Contracts → per-year salary via `get_salary_array(contracts)` (`utils.js`), indexed from the current year.

## Frontend architecture
- Routing in `frontend/src/App.jsx`. League pages live under `/league/:league_id` wrapped by `LeagueProvider` + `Layout`. Settings live under `/league/:id/settings` wrapped by **`SettingsLayout`** (GitHub-style sidebar + `<Outlet/>`); the index redirects to `league-rules`.
- **Contexts**: `AuthContext` (`useAuth` → `user`), `LeagueContext` (`useLeague` → `league`, `isOwner`, `isCommish`, `subStatus`, `subPurchased`, `setLeague`, ...). `LeagueProvider` fetches the league and gates rendering until ready.
- API calls: `axios` directly in components, relative `/api/...` paths (proxied), usually `withCredentials: true` for mutations.
- After a mutation many components `window.location.reload()` — existing pattern, not ideal but common here.
- Prefer `league_display_name(league)` (`utils.js`) anywhere a league name is shown (respects `custom_name`).

### UI building blocks & conventions
- **`<Card>`** (`components/Card.jsx`): props `table`, `gap`, `width`, `maxWidth`, `portion`, `height`. `table` → `.table-card` (bordered, rounded, shaded header, row dividers). Without `table` → `.glass-card` (transparent, borderless — a layout/spacing wrapper only). `changeOnHover` → `.card-hover`.
- **`<Row>`** — flex row; `center` centers children, `align` sets cross-axis.
- **`.table-card`** = the visible bordered "card" look; **`.table-row`** = a divided menu row; **`.mainpanel`** = padded page wrapper.
- **Design tokens** live in `frontend/src/css/theme.css` (`--color-*`, `--space-*`, `--text-*`, `--radius-*`, `--topbar-height`, etc.). **theme.css is the global shared stylesheet** (imported once via `css/index.css`); put genuinely shared classes there.
- **Vite bundles every imported CSS globally** — class names are app-wide regardless of which component imports the file. Scope with specific class names, not by "which file imports it."
- Reusable bits added recently: `RenameLeagueButton` (rename dialog, commissioner-gated by parent), the `.sub-status` status dot + `active-sub`/`free-trial`/`inactive-sub` colors, the commissioner **toggle switch** (`.switch`/`.switch-slider` in `LeagueMember.css`), and GitHub-style setting fields (`.setting-field` / `.setting-field-head` / `.setting-field-desc`).

### Roster/table horizontal alignment pattern (important)
The roster table header (`RosterHeading`) and rows (`Roster`) must scroll **together** horizontally. The working pattern (used on Rosters page and Trade Center) is:
```
<div className="table-card">
  <div className="roster-table-scroll">      /* owns overflow: auto */
    <div className="roster-inner">           /* min-width: max-content → full content width */
      <RosterHeading .../>                   /* .heading is position: sticky; top: 0 */
      <Roster .../>
```
`Roster` renders `RosterSpot` rows; its `inDialog` prop flexes behavior (dialog picker vs. page grid). `RosterHeading` grid columns must match `RosterSpot` grid columns or headers won't line up.

## Conventions
- Follow the surrounding style: React function components, snake_case for many handler/vars (mixed with camelCase), double quotes common, minimal comments.
- Match the existing CSS token vocabulary; support light **and** dark (tokens are theme-aware).
- After frontend edits, run `npm run build` to confirm it compiles. There are no automated tests to run.
- Commit/push only when asked; branch off `main` first if needed.
