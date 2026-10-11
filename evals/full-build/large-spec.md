# LinkBox — MVP

A team URL shortener. Build the whole MVP in this directory. It is big enough to split into milestones.

## Stack (fixed)
- Node.js 22+ with TypeScript for the server. Any HTTP framework (or none).
- Storage: SQLite via the built-in `node:sqlite` module. No native npm modules, no Docker, no external services.
- Frontend: React (built with Vite), served by the same server at `/`.

## Commands (must work exactly like this, from a fresh clone)
- `npm install`
- `npm run build` — builds server and frontend.
- `npm start` — starts the server. Reads `PORT` (default 3000) and `DB_PATH` (default `./linkbox.db`). The database file and schema are created if missing.
- `npm test` — runs your own tests; exits 0 when they pass.

## General API rules
- JSON in and out (`application/json`). Invalid JSON body: `400`.
- Every 4xx response has a JSON body `{ "error": string }`.
- Auth: `Authorization: Bearer <token>`. Missing or invalid token on a protected route: `401`.
- Authenticated but not allowed: `403`. Unknown resource: `404`. Ids are integers.
- Timestamps are ISO-8601 strings in UTC.

## Users and auth
- `POST /api/auth/register` `{ email, password }` → `201 { token, user: { id, email } }`.
  - email must contain `@` and be at most 254 chars; it is stored lower-cased and must be unique (`409`). password at least 8 chars. Otherwise `400`.
  - Passwords are stored hashed (`node:crypto` scrypt or pbkdf2), never in plain text.
- `POST /api/auth/login` `{ email, password }` → `200 { token, user }`; wrong email or password → `401`. Email match is case-insensitive.
- `GET /api/me` → `200 { id, email }`.
- Tokens stay valid across a server restart.

## Teams
- `POST /api/teams` `{ name }` (1–64 chars, else `400`) → `201 { id, name, role: "owner" }`. The creator is the owner.
- `GET /api/teams` → `200` array of `{ id, name, role }` for teams the user belongs to.
- `GET /api/teams/:id/members` → `200` array of `{ userId, email, role }`. Members only (non-member: `403`).
- `POST /api/teams/:id/members` `{ email, role }` with role `admin` or `member` → `201 { userId, email, role }`.
  - Only owner/admin may add (`403`). Unknown email → `404`. Already a member → `409`. Bad role → `400`.
- `DELETE /api/teams/:id/members/:userId` → `204`. Only owner/admin may remove others; anyone may remove themselves. The owner cannot be removed (`400`).

Roles: `owner` > `admin` > `member`.

## Links
Slugs are globally unique and case-sensitive.

- `POST /api/teams/:id/links` `{ url, slug?, tags?, expiresAt? }` → `201` link. Any team member may create.
  - `url`: absolute `http`/`https`, ≤ 2048 chars, else `400`.
  - `slug`: `^[A-Za-z0-9_-]{3,32}$`, else `400`. Reserved: `api`, `assets`, `index.html` → `400`. Taken → `409`. If omitted, a random 7-char `[A-Za-z0-9]` slug.
  - `tags`: array of up to 10 strings, each `^[a-z0-9-]{1,24}$`, else `400`. Stored de-duplicated, sorted.
  - `expiresAt`: ISO-8601 string in the future, else `400`.
- Link shape: `{ id, slug, url, shortUrl, teamId, createdBy, tags, expiresAt, clicks, createdAt }` where `shortUrl` = `http://<Host header>/<slug>`, `createdBy` = user id, `expiresAt` = string or `null`.
- `GET /api/teams/:id/links?q=&tag=&limit=&offset=` → `200 { items, total }`. Members only.
  - Newest first. `q` matches case-insensitively as a substring of slug or url. `tag` filters to links having that tag. `limit` default 20, max 100 (larger → 100); `offset` default 0. `total` counts all matches before paging.
- `GET /api/links/:slug` → `200` link (members of its team only, else `403`).
- `PATCH /api/links/:slug` `{ url?, tags?, expiresAt? }` → `200` updated link. Same validation as create; `expiresAt: null` clears it. Members of the team may edit.
- `DELETE /api/links/:slug` → `204`. Only the link's creator or a team owner/admin (`403` otherwise).
- `GET /api/teams/:id/links.csv` → `200`, `Content-Type: text/csv`, header row `slug,url,clicks,createdAt`, one row per link newest first, fields quoted per RFC 4180 when needed.

### Rate limit
Each user may create at most 30 links per rolling 60 seconds. The 31st returns `429` with a `Retry-After` header (seconds, integer ≥ 1).

## Redirects and analytics
- `GET /:slug` → `302` to the url, and records a click (time, `Referer` header or none). Unknown → `404`. Expired (`expiresAt` ≤ now) → `410` and no click recorded.
- `GET /api/links/:slug/stats` → `200 { total, byDay, topReferrers }` (team members only).
  - `byDay`: exactly 7 entries `{ date: "YYYY-MM-DD", count }` for the last 7 UTC days, oldest first, ending today, zero-filled.
  - `topReferrers`: up to 5 `{ referrer, count }` sorted by count desc; referrer is the host name of the `Referer` URL, or `"direct"` when there is none.

## Frontend (`GET /`)
A single-page app that lets a user register / log in / log out, create and switch teams, add members, create links (with tags and expiry), search and filter the list, page through it, delete links, and see a link's stats. It must be usable at phone width. Keep the token in `localStorage`.

## Requirements
- Data survives a server restart.
- 50 concurrent link creations by different users must all succeed with distinct slugs.
- A `README.md` explains how to run it.
