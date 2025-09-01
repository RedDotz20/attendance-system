# File map

Quick reference to important files and folders in this repository.

Root

- `README.md` — high-level project overview (also see `docs/`)

Client (`client/`)

- `package.json` — scripts and dependencies
- `src/main.tsx` — app entry
- `src/routes/` — route components
- `src/features/auth/` — authentication UI and hooks

Server (`server/`)

- `package.json` — scripts and dependencies
- `src/index.ts` — server bootstrap
- `src/app.ts` — express app, middleware and routing
- `src/modules/rfid` — controllers, models and routes for RFID ingestion
- `server/RFID_API.md` — detailed RFID API contract

Firmware (`firmware/`)

- `platformio.ini` — PlatformIO build config
- `src/main.cpp` — firmware entrypoint
- `lib/` — included libraries (MFRC522, WiFiManager, LiquidCrystal)

Docs

- `docs/` — design, development and deployment guides and API index
