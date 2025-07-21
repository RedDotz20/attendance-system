import mongoose from "mongoose";
import { logger } from "@/shared/utils/logger.js";
import type { Context } from "hono";

export const healthCheckController = async (c: Context) => {
	try {
		// Guard clause for the happy path (connected)
		if (mongoose.connection.readyState === 1) {
			logger.info("Server and MongoDB are running normally");
			return c.json(
				{
					status: "UP",
					message: "🔥 Server and MongoDB are running normally",
					database: "connected",
				},
				200
			);
		}

		// Handle all other non-error states (e.g., disconnected, connecting)
		logger.error("MongoDB is not connected");
		return c.json(
			{
				status: "DOWN",
				message: "MongoDB is not connected",
				database: "disconnected",
			},
			503
		);
	} catch (error) {
		// Handle any unexpected errors during the check
		logger.error("Error checking MongoDB connection status");
		return c.json(
			{
				status: "DOWN",
				message: "Error checking MongoDB connection status",
				database: "error", // More descriptive status for debugging
				error: error instanceof Error ? error.message : String(error),
			},
			503
		);
	}
};
