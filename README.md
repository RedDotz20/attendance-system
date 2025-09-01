# Attendance System

A full-stack attendance tracking system that combines a web client, a TypeScript/Node.js backend API, and firmware for an ESP32-based RFID reader device.

This repository contains three top-level components:

- `client/` — React + Vite web application (TypeScript) used by administrators and users to view and manage attendance data.
- `server/` — Node.js + TypeScript backend API that exposes endpoints for authentication, RFID events, and user management. It also contains middleware, models and database wiring.
- `firmware/` — Embedded firmware (PlatformIO/C++) that runs on an ESP32-based device which reads RFID tags and forwards events to the server.

This README provides a high-level project summary. Detailed documentation for each subsystem and instructions for development and deployment are provided in the `docs/` folder.

Quick links

- Docs: `docs/`
- Client code: `client/`
- Server code: `server/`
- Firmware: `firmware/`

Goals

- Provide reliable attendance capture using RFID readers.
- Secure user authentication & session management for administrative UI.
- Modular codebase: separate client, server and firmware for independent development and deployment.

Getting started (dev)

1. Install a recent Node.js (18+) and pnpm.
1. From repo root, start server and client in separate shells:

Server

```bash
cd server
cp .env.example .env # edit values (database, JWT secret, etc.)
pnpm install
pnpm dev
```

Client

```bash
cd client
cp .env.example .env # edit values if present
pnpm install
pnpm dev
```

1. For firmware, open `firmware/platformio.ini` and use PlatformIO (VS Code extension or CLI) to build and flash to an ESP32 device.

Where to find more information

- Detailed docs: `docs/` — architecture, how each subsystem works, APIs, and development/deployment notes.
- Server RFID API reference: `server/RFID_API.md` (additional reference).

Contributing

See `docs/development.md` for contribution guidelines, coding style and how to run locally.

License

Check repository root or ask the maintainers for license information.

Using Docker / docker-compose

You can run the server and a MongoDB instance locally with Docker Compose. Make sure `server/.env` exists and contains a MongoDB connection string pointing at `mongodb://mongo:27017/<yourdb>`.

Start the stack:

```bash
docker compose up --build
```

Stop the stack:

```bash
docker compose down
```
