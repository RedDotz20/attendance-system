# Client (web app)

Location: `client/`

Stack

- React + TypeScript
- Vite
- pnpm

Purpose

The client is the web application used by administrators and users to view attendance, manage users, and perform admin tasks.

Important files and folders

- `src/main.tsx` — application entry
- `src/routeTree.gen.ts` and `src/routes/` — routing structure and route components
- `src/features/` — feature folders for `auth`, `dashboard`, and error pages
- `src/components/` — shared UI components (layouts, UI primitives)
- `public/` — static assets
- `package.json`, `tsconfig.json`, `vite.config.ts` — project config

Local development

1. cd into `client/`
2. Install: `pnpm install`
3. Start dev server: `pnpm dev`

Environment

Copy `.env.example` to `.env` if present and configure API base URL to point to the running server.

Testing and linting

Refer to `package.json` scripts for available tasks (lint, test, build).
