import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export function jsonError(c: Context, status: number, message: string) {
	c.status(status as StatusCode);
	return c.json({ error: message });
}
