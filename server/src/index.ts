import { serve } from "@hono/node-server";
import app from "./app.js";

// Determine environment mode
const environment = process.env.NODE_ENV || "development";
const port = parseInt(process.env.PORT || "3000");

console.log(`✅ Running in ${environment} mode`);

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(`🚀 Server is running on http://localhost:${info.port}`);
	}
);
