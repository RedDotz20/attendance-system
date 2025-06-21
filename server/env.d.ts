declare namespace NodeJS {
	interface ProcessEnv {
		NODE_ENV: "development" | "production";
		MONGODB_URI: string;
		PORT: string;
		// ... add more variables needed
	}
}
