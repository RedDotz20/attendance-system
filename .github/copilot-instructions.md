# Copilot Instructions

## Architecture

This is a three-component attendance tracking system:

- **`client/`** — React 19 + Vite SPA (TypeScript). Uses TanStack Router (file-based), TanStack Query for server state, TanStack Form + Zod for forms, and shadcn/ui + Tailwind CSS for UI.
- **`server/`** — Hono web framework on Node.js (TypeScript). Uses MongoDB via Mongoose, Pino for logging, and Zod for request validation. **Not Express** — use Hono APIs (`c.json()`, `c.req.json()`, etc.).
- **`firmware/`** — PlatformIO/C++ targeting ESP32. Reads RFID cards (MFRC522) or fingerprints (Adafruit R307) and POSTs events to the server over HTTP.

Communication flow: firmware → server (HTTP with API key auth) ← client (REST with cookie-based session auth).

## Build, Test, and Lint

All components use **pnpm**. Run commands from each component's directory.

```bash
# Server
cd server
pnpm dev          # Dev server with hot reload (tsx watch)
pnpm build        # TypeScript compilation (tsc)
pnpm start        # Production (node dist/index.js)

# Client
cd client
pnpm dev          # Dev server on port 3001
pnpm build        # Vite production build with type check
pnpm test         # Run Vitest tests

# Workspace-wide (from repo root)
pnpm -w -r lint   # Lint all packages
pnpm -w -r test   # Test all packages

# Docker
docker compose up --build   # Runs server + MongoDB + client
```

To run a single test file (client):

```bash
cd client
pnpm vitest run src/path/to/file.test.ts
```

Firmware is built and flashed via PlatformIO CLI or VS Code extension.

## Server Conventions

### Module structure

Each feature is a self-contained module under `src/modules/` (auth, users, rfid, fingerprint) with this layout:

```
modules/<feature>/
  controller/    # Request handlers (*.controller.ts)
  models/        # Mongoose schemas (*.model.ts)
  routes/        # Route definitions (*.routes.ts)
  service/       # Business logic (*.service.ts)
  validators/    # Zod schemas (*.validator.ts)
  types/         # TypeScript interfaces (*.type.ts)
```

Shared code lives in `src/shared/` (middleware, config, utils, types).

### Response format

Always use the standardized response helpers from `src/shared/utils/response.ts`:

```typescript
import { success, created, paginated, notFound, conflict } from "@/shared/utils/response.js";

return success(c, data, "Optional message");
return created(c, data);
return notFound(c, "User");
```

All responses follow: `{ success, data, message, timestamp, error? }`.

### Authentication

Two auth mechanisms coexist:

- **Session auth** (web client): cookie-based via `sessionAuth` middleware. Sessions stored in MongoDB with 7-day expiry.
- **API key auth** (firmware/hardware): `X-API-Key` header or `?api_key=` query param via `apiKeyAuthFlexible` middleware.

Role-based access uses `requireRole`, `requireAdmin`, `requireSelfOrAdmin` middleware.

### Validation pattern

Validate with Zod in controllers using `safeParse`, then flatten errors:

```typescript
const parsed = MySchema.safeParse(body);
if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return c.json({ message: "Validation Failed", errors: fieldErrors }, 400);
}
```

### Error handling

Custom error classes in `src/shared/utils/error-handler.ts`: `AppError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ConflictError`, `DatabaseError`. Global error handler is registered via `app.onError()`.

### Import paths

Server uses `@/*` path alias mapped to `src/*`, **with `.js` extensions** for Node.js ESM compatibility:

```typescript
import { logger } from "@/shared/utils/logger.js";
```

## Client Conventions

### Routing

TanStack Router with file-based route generation. Routes live in `src/routes/`:

- `__root.tsx` — root layout, prefetches auth state
- `_authenticated.tsx` — protected route group (enforces auth via `beforeLoad`)
- `(auth)/`, `(errors)/` — route groups (don't affect URL path)
- `routeTree.gen.ts` is auto-generated — never edit manually

### Feature structure

Features are organized under `src/features/<name>/` with `hooks/`, `services/`, `schema/`, `types/` subdirectories.

### API calls

Use the static `ApiClient` class from `src/lib/api-client.ts` with generics:

```typescript
const users = await ApiClient.get<User[]>("/users");
await ApiClient.post<User, CreateUserDto>("/users", data);
```

Axios is configured in `src/lib/axios.ts` with base URL from `VITE_API_URL`, cookie credentials, and `X-API-Key` header.

### State management

- **Server state**: TanStack Query (useQuery/useMutation). No Redux or Zustand.
- **Auth state**: `useAuth()` hook wrapping React Query with query key `["auth", "me"]`.
- **UI state**: React Context for theme; localStorage for preferences.

### UI components

shadcn/ui with `new-york` style. Add new components with:

```bash
pnpx shadcn@latest add <component>
```

Use the `cn()` utility from `@/lib/utils` for conditional class merging (clsx + tailwind-merge).

### Import paths

Client uses `@/*` path alias mapped to `src/*` (no `.js` extensions needed):

```typescript
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
```

## File Naming

Both client and server use kebab-case filenames with descriptive suffixes:

| Suffix | Example |
|---|---|
| `*.controller.ts` | `sign-up.controller.ts` |
| `*.model.ts` | `user.model.ts` |
| `*.routes.ts` | `auth.routes.ts` |
| `*.service.ts` | `session.service.ts` |
| `*.validator.ts` | `rfid.validator.ts` |
| `*.type.ts` | `user.type.ts` |
| `*.middleware.ts` | `auth.middleware.ts` |
| `*.schema.ts` | `auth.schema.ts` (client) |

Components use PascalCase: `AuthenticatedLayout.tsx`, `ThemeProvider.tsx`.

## Git Workflow

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, etc.
- **Branch naming**: `feature/short-description` or `fix/short-description`
- **PRs target**: `dev` branch
- **CI**: Runs on push to `main` and PRs against `main` — builds, lints, and tests both client and server.
