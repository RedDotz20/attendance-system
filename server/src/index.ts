import { serve } from "@hono/node-server";
import { logger } from "@/shared/utils/logger.js";
import os from "os";
import app from "./app.js";

const environment = process.env.NODE_ENV || "development";
const port = parseInt(process.env.PORT || "3000");

function getLocalIp(): string | null {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name] || []) {
			if (iface.family === "IPv4" && !iface.internal) {
				return iface.address;
			}
		}
	}
	return null;
}

serve(
	{
		fetch: app.fetch,
		port,
		hostname: "0.0.0.0",
	},
	(info) => {
		const lanIp = getLocalIp();
		if (environment === "production") {
			logger.info(`🚀 Server is running in production on port ${info.port}`);
		} else {
			logger.info(
				`🚀 Server is running locally at http://localhost:${info.port}`
			);
			if (lanIp) {
				logger.info(`🌐 Accessible on LAN at http://${lanIp}:${info.port}`);
			}
		}
	}
);
