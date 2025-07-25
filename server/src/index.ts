import { serve } from "@hono/node-server";
import { logger } from "@/shared/utils/logger.js";
import app from "./app.js";

// Determine environment mode and port
const environment = process.env.NODE_ENV || "development";
const port = parseInt(process.env.PORT || "3000");

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		if (environment === "production") {
			logger.info(`🚀 Server is running in production on port ${info.port}`);
		} else {
			logger.info(`🚀 Server is running at http://localhost:${info.port}`);
		}
	}
);
