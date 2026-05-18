# Clippr

A lightweight pastebin for sharing code, configs, and notes. Syntax highlighted. Fast.

## Stack

- **Backend** — Bun + Hono, SQLite (FTS5 full-text search), JWT auth
- **Frontend** — React + Vite, TypeScript
- **Deployment** — Railway (backend), Vercel (frontend)

## Features

- Create public or private pastes with syntax highlighting
- Full-text search across public pastes
- User accounts with profile pages
- Organizations with invite-based membership

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Install

```bash
bun install
```

### Configure

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set a strong `JWT_SECRET`.

### Run

```bash
bun run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Deploy

- **Backend**: Connect the `backend/` directory to a Railway service. Set env vars from `.env.example`.
- **Frontend**: Connect the `frontend/` directory to Vercel. Set `VITE_API_URL` to your Railway backend URL.
