import mongoose from "mongoose";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { loggingMiddleware } from "./middleware/logger.js";
import { sessionAuth, requireRole } from "./middleware/auth.js";
import authRoute from "./routes/auth.js";
import auth from "./routes/auth.js";
import type { Context } from "hono";
import "dotenv/config";

type User = {
	name: string;
	role: string;
	// add other user properties as needed
};

type Variables = {
	user: User;
};

const app = new Hono<{ Variables: Variables }>();

mongoose
	.connect(process.env.MONGODB_URI!)
	.then(() => console.log("✅ MongoDB connected"))
	.catch((err) => console.error("❌ MongoDB error:", err));

// app.use("*", loggingMiddleware);
app.route("/auth", auth);

app.get("/admin", sessionAuth, requireRole("admin"), (c) => {
	return c.text("Hello admin");
});

app.get("/dashboard", sessionAuth, (c) => {
	const user = c.get("user");
	return c.text(`Hello ${user.name} (${user.role})`);
});

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
