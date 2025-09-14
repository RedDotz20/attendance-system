# Deployment

This section provides a general checklist for deploying the Attendance System.

Server

- Build and run the TypeScript server (or compile to JS) in a production environment. Use PM2, Docker, or a managed Node hosting service.
- Ensure environment variables are set securely (database URL, JWT secret, device API keys).
- Use HTTPS for external clients and devices.

Client

- Build the client (`pnpm build`) and serve the static output using a CDN or static hosting (Netlify, Vercel, S3 + CloudFront).

Firmware

- Provision device secrets during manufacturing or first-boot.
- Ensure firmware points at the final production server URL and uses secure authentication.

Database migrations

- If your server uses migrations, run them as part of the deployment pipeline. Back up data before applying schema changes.

Monitoring and logging

- Configure central logging for the server and devices. Use health checks and alerts.
