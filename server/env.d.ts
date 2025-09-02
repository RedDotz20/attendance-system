declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production";
		MONGODB_URI: string;
		PORT: string;
		FRONTEND_ORIGIN: string;
		UPSTASH_REDIS_REST_URL: string;
		UPSTASH_REDIS_REST_TOKEN: string;
		API_SECRET_KEY: string;
		// ... add more variables needed
	}
}
