# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run both backend and frontend concurrently
bun run dev

# Run individually
bun run dev:backend    # Hono API on http://localhost:3001
bun run dev:frontend   # Vite dev server on http://localhost:5173 (proxies /api to :3001)
```

### Frontend
```bash
cd frontend
bun run build    # TypeScript check + Vite build → dist/
bun run preview  # Preview production build locally
```

### Backend
```bash
cd backend
bun run start    # Run migrations then start server
bun run migrate  # Run migrations only
```

### Docker (production)
```bash
docker compose up -d --build   # Rebuild and restart backend (data volume persists)
docker compose logs -f backend # Tail logs
```

## Architecture

This is a monorepo with a Bun workspace (`package.json` at root) containing `backend/` and `frontend/`.

### Backend (`backend/src/`)
- **Runtime**: Bun + Hono framework
- **Database**: SQLite via `bun:sqlite` — file path set by `DB_PATH` env var (defaults to `../../pastebin.db` in dev, `/data/pastebin.db` in Docker)
- **Auth**: JWT stored as httpOnly cookie **and** returned in response body as `token`. All API clients send it as `Authorization: Bearer <token>`. Both `requireAuth` and `optionalAuth` middlewares accept either cookie or Bearer header.
- **Migrations**: Auto-run on startup from `src/db/migrations/*.sql` (tracked in `_migrations` table)
- **Search**: SQLite FTS5 virtual table (`documents_fts`) with Porter stemmer, kept in sync via triggers
- **Syntax highlighting**: `shiki` runs server-side at paste creation time, result stored as `highlighted_html`
- **Rate limiting**: In-memory via `rate_limit_log` table — no external cache needed

Route files map 1:1 to resource: `auth.ts`, `documents.ts`, `organizations.ts`, `search.ts`, `users.ts`.

### Frontend (`frontend/src/`)
- **Framework**: React + Vite, TypeScript strict mode
- **State**: TanStack Query for all server state. Auth state lives in the `["me"]` query key.
- **Auth flow**: Token stored in `localStorage` as `auth_token`. `useAuth` hook skips the `/me` fetch entirely if no token exists (`enabled: !!getToken()`). On 401, token is cleared from localStorage. Logout clears token locally first (never fails).
- **Layout**: `AppShell` renders either `TopNav` layout (logged-out) or `Sidebar` layout (logged-in) based on auth state. Shows a full-page spinner while auth is loading to prevent layout flash.
- **API layer**: All requests go through `apiFetch` in `api/client.ts` which attaches the Bearer token and `ngrok-skip-browser-warning` header automatically.
- **Routing**: `ProtectedRoute` wraps auth-required pages. `/` redirects to `/new` when logged in via `HomeRedirect` component.

### Key data model notes
- Documents have three privacy levels: `public`, `org` (org members only), `private` (owner + explicitly shared users)
- Organizations have `public`/`private` visibility. Members have roles: `owner`, `admin`, `member`
- Invite flow: `GET /api/orgs/join/:code` previews, `POST` joins. Frontend auto-joins on page load if user is already authenticated.

### Deployment
- **Frontend**: Vercel — set `VITE_API_URL` to the backend URL
- **Backend**: Docker on VM — `docker-compose.yml` at repo root, SQLite stored in named volume `db_data`
- **CORS**: Backend `FRONTEND_URL` env var must match the Vercel deployment URL exactly
