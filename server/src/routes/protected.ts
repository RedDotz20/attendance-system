import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

type Variables = {
	session: { get: () => any };
};

export const protectedRoute = new Hono<{ Variables: Variables }>();

// Require authentication on all protected routes
protectedRoute.use("*", requireAuth);

protectedRoute.get("/me", requireRole("user"), async (c) => {
	const session = c.get("session");
	const user = session.get();
	return c.json({ user });
});

protectedRoute.get("/admin/dashboard", requireRole("admin"), (c) => {
	return c.text("Admin-only metrics view");
});

protectedRoute.get("/user/dashboard", requireRole("user"), (c) => {
	return c.text("User-specific dashboard");
});
