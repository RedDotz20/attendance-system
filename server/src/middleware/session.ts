import type { MiddlewareHandler } from "hono";
import { Session } from "../models/Session.js";
import { v4 as uuidv4 } from "uuid";

const COOKIE_NAME = "sid";
const EXPIRY = 1000 * 60 * 60 * 24;

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
	const getCookie = (
		cookieHeader: string | null,
		name: string
	): string | undefined => {
		if (!cookieHeader) return undefined;
		const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
		for (const cookie of cookies) {
			const [key, ...rest] = cookie.split("=");
			if (key === name) {
				return rest.join("=");
			}
		}
		return undefined;
	};
	let sid = getCookie(c.req.header("Cookie") ?? null, COOKIE_NAME);

	let doc: { expiresAt: number | Date; data: any; save: () => any } | null =
		null;

	if (sid) {
		doc = await Session.findOne({ sid });
		if (!doc || doc.expiresAt < new Date()) {
			sid = undefined;
			doc = null;
		}
	}

	if (!sid) {
		sid = uuidv4();
		doc = await Session.create({
			sid,
			data: {},
			expiresAt: new Date(Date.now() + EXPIRY),
		});
		c.header("Set-Cookie", `${COOKIE_NAME}=${sid}; Path=/; HttpOnly`);
	}
	c.set("session", {
		get: () => doc!.data,
		set: async (data: any) => {
			if (!doc) throw new Error("Session document not found");
			doc.data = data;
			doc.expiresAt = new Date(Date.now() + EXPIRY);
			await doc.save();
		},
		destroy: async () => {
			await Session.deleteOne({ sid });
			c.header("Set-Cookie", `${COOKIE_NAME}=; Max-Age=0; Path=/`);
		},
	});

	await next();
};
