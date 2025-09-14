# System Architecture

The Attendance System is split into three main components:

- Client (web app): a TypeScript React application built with Vite. It provides the administrative UI for managing users, viewing attendance records, and authenticating.
- Server (API): a Node.js + TypeScript REST API which handles authentication, user management, and RFID events. It contains middleware, models, and route modules grouped under `src/modules/`.
- Firmware: an ESP32-based firmware project (PlatformIO/C++) that manages the RFID reader hardware, reads tag UIDs, and sends events to the server.

Components communicate as follows:

- The firmware connects to WiFi and posts RFID events to the server's RFID endpoints.
- The server persists RFID and attendance data to a database and exposes REST endpoints used by the client.
- The client interacts with the server for authentication and UI-driven data operations.

This separation keeps hardware and software concerns separate and enables independent development and deployment.
