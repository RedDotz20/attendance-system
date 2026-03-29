import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const apiUrl = env["VITE_API_URL"] || "http://127.0.0.1:3000";
	const port = parseInt(env["VITE_PORT"] || "80", 10);
	const isDevelopment = mode === "development";

	const config = {
		plugins: [
			tanstackRouter({ autoCodeSplitting: true }),
			viteReact(),
			tailwindcss(),
		],
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
			},
		},
		build: {
			sourcemap: true,
		},
		server: {
			port: port,
		} as any,
	};

	if (isDevelopment) {
		config.server.proxy = {
			"/api": {
				target: apiUrl,
				changeOrigin: true,
			},
		};
	}

	return config;
});
