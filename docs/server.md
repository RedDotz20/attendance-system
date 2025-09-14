# Server (API)

Location: `server/`

Stack

- Node.js + TypeScript
- pnpm

Purpose

The server provides REST endpoints for authentication, user management and RFID event ingest. It contains organized modules under `src/modules/` for `auth`, `users`, and `rfid`.

Important files and folders

- `src/index.ts` — server bootstrap
- `src/app.ts` — express app setup, middleware and route mounting
- `src/modules/` — feature modules (auth, rfid, users)
- `src/shared/middleware/` — cross-cutting middleware (auth, CORS, error handler, logger, rate limiter)
- `src/shared/config/` — environment & database configuration
- `src/shared/models/` — shared database models or types

Environment and secrets

Copy `.env.example` to `.env` and set the following at minimum:

- Database connection string
- JWT secret and expiry
- Any API keys or device secrets used by firmware devices

Local development

1. cd into `server/`
2. Install: `pnpm install`
3. Start dev server: `pnpm dev` (or run `pnpm start` depending on scripts)

Database

The server expects a database to be configured via environment variables in `src/shared/config/env.ts`.

API docs

The repository includes `server/RFID_API.md` documenting the RFID endpoints. See `docs/api.md` for a gateway overview and links.
