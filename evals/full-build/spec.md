# LinkBox — Milestone 1

A team URL shortener. Build milestone 1 end to end in this directory.

## Stack (fixed)
- Node.js 22+ with TypeScript for the server. Any HTTP framework (or none).
- Storage: SQLite via the built-in `node:sqlite` module. No native npm modules, no Docker, no external services.
- Frontend: React (built with Vite), served by the same server at `/`.

## Commands (must work exactly like this, from a fresh clone)
- `npm install`
- `npm run build` — builds server and frontend.
- `npm start` — starts the server. Reads `PORT` (default 3000) and `DB_PATH` (default `./linkbox.db`) from the environment. The database file is created if missing.
- `npm test` — runs your own tests; exits 0 when they pass.

## HTTP API
All JSON bodies are `application/json`.

### `POST /api/links`
Body: `{ "url": string, "slug"?: string }`
- `url` must be an absolute `http` or `https` URL, at most 2048 characters. Otherwise `400`.
- `slug`, if given, must match `^[A-Za-z0-9_-]{3,32}$`, otherwise `400`. Slugs are case-sensitive.
- Slugs `api`, `assets` and `index.html` are reserved: `400`.
- If the slug is already taken: `409`.
- If no slug is given, generate a random 7-character slug from `[A-Za-z0-9]` that is not taken.
- Success: `201` with `{ "slug", "url", "shortUrl", "clicks": 0, "createdAt" }`. `shortUrl` is `http://<Host header>/<slug>`. `createdAt` is an ISO-8601 string.
- Invalid JSON body: `400`.
- Every `400`/`409` response has a JSON body `{ "error": string }`.

### `GET /api/links`
`200` with a JSON array of all links (same shape as above, with current `clicks`), newest first.

### `GET /api/links/:slug`
`200` with the link, or `404` with `{ "error" }`.

### `DELETE /api/links/:slug`
`204` on success, `404` if unknown.

### `GET /:slug`
`302` redirect to the stored `url` (`Location` header) and increments `clicks` by 1. Unknown slug: `404`.

## Frontend (`GET /`)
A single page that:
- has a form to create a link (url, optional custom slug) and shows the resulting short URL or the error message,
- lists existing links (slug, target url, clicks) and lets the user delete one,
- is usable on a phone-width screen.

## Requirements
- Data survives a server restart (same `DB_PATH`).
- 50 concurrent `POST /api/links` without a slug must all succeed with distinct slugs.
- Include a short `README.md` with how to run it.
