# Farlands Hackathon 2026

Squad registration + UPI payment + admin verification for the Farlands Hackathon event.

## Architecture

- **`server/`** — standalone Node HTTP server (`tsx server/index.ts`). Serves the `/api` routes (registration, auth, payments, admin) and, in production, the built frontend from `dist/`. The old Next.js app and its route handlers were removed; the handlers now live in `server/routes/`.
- **Frontend** — a Vite + Three.js static site (`index.html`, `src/`, `public/models/`). The registration form in `src/hackathon.js` POSTs to `/api/registration`.
- **`lib/`** (and its mirror `backend/lib/`) — the pure backend module: Supabase access, validation, sessions, rate limiting, security, team ID generation, manual payment handling.
- **`backend/tests/`** — unit and live integration tests for the backend module.

## Getting Started

```bash
npm install
```

Create `.env.local` from `.env.example` with your Supabase project + UPI + admin credentials.

### Development

Runs the API server (port 3000) and the Vite dev server (port 5173) together. Vite proxies `/api` to the API server, so the frontend talks to the backend same-origin and session cookies work out of the box.

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:server   # API on http://localhost:3000
npm run dev:frontend # web on http://127.0.0.1:5173
```

### Production

```bash
npm run build  # vite build -> dist/
npm start      # single server serving /api + dist/ on PORT (default 3000)
```

Open http://localhost:3000

## Testing

```bash
npm test            # backend unit tests + frontend timeline tests (no env needed)
npm run test:live   # live Supabase integration tests (requires .env.local)
npm run test:browser   # Playwright browser smoke test against a running dev server
npm run typecheck   # tsc --noEmit
```

## Admin provisioning

```bash
npm run provision:admin
```

## API

See [docs/BACKEND_API.md](docs/BACKEND_API.md) for the full endpoint reference (new frontend `teammates` payload included).

## Deploy

`npm run build && npm start` on any Node 20+ host. Set `PORT`, `NODE_ENV=production`, and the Supabase/UPI env vars. `NODE_ENV=production` disables CORS and switches cookies to `__Host-` (secure) mode.