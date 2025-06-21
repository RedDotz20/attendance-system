import type { MiddlewareHandler } from "hono";
import { jsonError } from "../utils/responses.js";

export const requireAuth: MiddlewareHandler = async (c, next) => {
	const session = c.get("session");
	const user = session.get();

	if (!user?.userId || !user?.role) {
		return jsonError(c, 401, "Unauthorized: Please login first.");
		// return c.text("Unauthorized", 401);
	}

	await next();
};
