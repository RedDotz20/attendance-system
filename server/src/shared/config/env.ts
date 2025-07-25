// src/config/env.ts
import { loadEnv } from "@/shared/utils/loadEnv.js";

export const env = loadEnv({
	required: [
		"MONGODB_URI",
		"UPSTASH_REDIS_REST_URL",
		"UPSTASH_REDIS_REST_TOKEN",
	],
	defaults: {
		PORT: "3000",
		NODE_ENV: "development",
		DEBUG: "true",
		FRONTEND_ORIGIN: "http://localhost:3001/",
	},
});
