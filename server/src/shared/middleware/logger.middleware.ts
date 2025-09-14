import type { MiddlewareHandler } from "hono";
import { Log } from "../models/log.model.js";

export const loggingMiddleware: MiddlewareHandler = async (c, next) => {
	await next();

	// Temporarily disabled due to type issues
	// const session = c.get("session");
	// const user = session.get?.();

	// if (user?.userId) {
	// 	await (Log as any).create({
	// 		userId: user.userId,
	// 		username: user.username,
	// 		role: user.role,
	// 		method: c.req.method,
	// 		path: c.req.path,
	// 	});
	// }
};
