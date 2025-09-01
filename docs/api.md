# API Reference

This document gives an overview of the server API and points to the detailed RFID API reference.

Server

Look in `server/src/modules/` for route implementations and controller logic.

RFID endpoints

See `server/RFID_API.md` for the detailed RFID API contract used by firmware devices. That file documents endpoints, payload shapes and expected responses.

Authentication

The server exposes authentication endpoints under the `auth` module. The client uses these to sign in, sign out and manage sessions.

Errors

The server exposes sensible HTTP status codes and has error middleware located in `server/src/shared/middleware/errorHandler.middleware.ts`.
