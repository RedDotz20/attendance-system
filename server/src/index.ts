import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mongoose from "mongoose";
import { sessionMiddleware } from "./middleware/session.js";
import { authRoute } from "./routes/auth.js";
import { protectedRoute } from "./routes/protected.js";
import { loggingMiddleware } from "./middleware/logger.js";
import "dotenv/config";

const app = new Hono();

mongoose
	.connect(process.env.MONGODB_URI!)
	.then(() => console.log("✅ MongoDB connected"))
	.catch((err) => console.error("❌ MongoDB error:", err));

app.use("*", sessionMiddleware);
app.use("*", loggingMiddleware);
app.route("/auth", authRoute);
app.route("/protected", protectedRoute);

app.get("/health", (c) => {
	return c.text("🔥 Hello Hono!");
});

serve(
	{
		fetch: app.fetch,
		port: parseInt(process.env.PORT!),
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);
