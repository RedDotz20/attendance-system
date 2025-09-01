# Development guide

This guide covers local development workflows for the client, server and firmware.

Prerequisites

- Node.js 18+ and `pnpm`
- PlatformIO (for firmware) — VS Code extension or CLI
- A running database (Postgres, MySQL, or SQLite depending on server config)

Running components

- Server

  - cd `server/`
  - cp .env.example .env and update values
  - pnpm install
  - pnpm dev

- Client

  - cd `client/`
  - pnpm install
  - pnpm dev

- Firmware

  - Open the `firmware/` folder in VS Code with PlatformIO installed, configure `platformio.ini`, build and upload to your device.

Testing

Run unit and integration tests where available. Check `package.json` scripts in each top-level folder for test commands.

Debugging tips

- Server: use `console`/logger outputs and middleware to inspect incoming requests. The server also contains a simple health controller in `src/shared/controller/health.controller.ts`.
- Client: open browser dev tools and watch network calls to ensure correct API URLs and CORS configuration.
- Firmware: use serial monitor to see device logs when connecting to WiFi and posting events.
