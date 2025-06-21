import type { MiddlewareHandler } from "hono";
import { jsonError } from "../utils/responses.js";

export const requireRole = (
	requiredRole: "user" | "admin"
): MiddlewareHandler => {
	return async (c, next) => {
		const session = c.get("session");
		const user = session.get();

		if (!user || !user.role) {
			return jsonError(c, 401, "Unauthorized: Login required.");
		}
		// if (!user || !user.role) return c.text("Unauthorized", 401);

		if (user.role === "admin" || user.role === requiredRole) {
			await next();
		} else {
			return jsonError(c, 403, "Forbidden: Insufficient privileges.");
			// return c.text("Forbidden", 403);
		}
	};
};
