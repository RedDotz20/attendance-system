import type { MiddlewareHandler } from "hono";
import { Log } from "../models/Log.js";

export const loggingMiddleware: MiddlewareHandler = async (c, next) => {
	await next();

	const session = c.get("session");
	const user = session.get?.();

	if (user?.userId) {
		await Log.create({
			userId: user.userId,
			username: user.username,
			role: user.role,
			method: c.req.method,
			path: c.req.path,
		});
	}
};
