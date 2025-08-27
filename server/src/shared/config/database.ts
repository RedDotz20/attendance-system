import mongoose from "mongoose";
import { logger } from "@/shared/utils/logger.js";
import { env } from "./env.js";
import "dotenv/config";

export const connectDB = async (): Promise<void> => {
	const startTime = Date.now();
	const uri = env.MONGODB_URI;

	const environment = process.env.NODE_ENV || "development";

	try {
		logger.info("🔌 Connecting to MongoDB...");
		logger.info(`🌐 Environment: ${environment}`);

		// Enable debug mode only in development
		if (environment === "development") {
			mongoose.set("debug", true);
			logger.info("🧪 Mongoose debug mode enabled");
		}

		const conn = await mongoose.connect(uri);
		const duration = Date.now() - startTime;

		// Readable connection state mapping
		const stateMap: Record<number, string> = {
			0: "🔴 disconnected",
			1: "🟢 connected",
			2: "🟡 connecting",
			3: "🟠 disconnecting",
		};
		const connectionState =
			stateMap[conn.connection.readyState] ?? "❓ unknown";

		logger.info(`✅ MongoDB Connected in ${duration}ms`);
		logger.info(`📶 State: ${connectionState}`);
		logger.info(`🌍 Host: ${conn.connection.host}`);
		logger.info(`📂 Database: ${conn.connection.name}`);

		// Optional pool size logging (if set in .env)
		if (process.env.MONGODB_POOLSIZE) {
			logger.info(`🧵 Max Pool Size: ${process.env.MONGODB_POOLSIZE}`);
		}
	} catch (error: unknown) {
		logger.error("❌ Failed to connect to MongoDB");
		if (error instanceof Error) {
			logger.error(`📛 ${error.name}: ${error.message}`);
			logger.error(error.stack);
		} else {
			logger.error(`📛 Unknown error: ${JSON.stringify(error)}`);
		}
		process.exit(1); // Fail fast if connection fails
	}
};
