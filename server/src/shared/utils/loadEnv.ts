import { config } from "dotenv";

type LoadEnvOptions = {
	prefix?: string;
	required?: string[];
	defaults?: Record<string, string>;
};

// Load .env only in non-production environments
if (process.env.NODE_ENV !== "production") {
	config();
}

export function loadEnv(options?: LoadEnvOptions): Record<string, string> {
	const { prefix, required = [], defaults = {} } = options || {};
	const envVars: Record<string, string> = {};

	for (const [key, value] of Object.entries(process.env)) {
		if (prefix && !key.startsWith(prefix)) continue;
		if (value !== undefined) {
			envVars[key] = value;
		}
	}

	// Apply defaults
	for (const [key, defaultValue] of Object.entries(defaults)) {
		if (!(key in envVars)) {
			envVars[key] = defaultValue;
		}
	}

	// Validate required
	const missing = required.filter((key) => !(key in envVars));
	if (missing.length > 0) {
		throw new Error(
			`❌ Missing required environment variables: ${missing.join(", ")}`
		);
	}

	return envVars;
}
