import mongoose from "mongoose";
import { logger } from "@/shared/utils/logger.js";
import "dotenv/config";

export const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI!);
		logger.info("✅ MongoDB connected");
	} catch (error) {
		console.error("❌ MongoDB connection error:", error);
	}
};
