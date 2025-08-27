// middleware/userAwareRateLimiter.ts
import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono";
import { Redis } from "@upstash/redis";
import { getSession } from "@/modules/auth/service/session.service.js";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const POINTS = 5;
const DURATION = 10; // seconds
const BLOCK_DURATION = 30; // seconds

export const upstashRateLimit: MiddlewareHandler = async (c, next) => {
	const cookie = c.req.header("cookie") || "";

	// User Aware Rate Limiter
	const sessionId = cookie
		.split(";")
		.find((v) => v.trim().startsWith("sessionId="))
		?.split("=")[1];

	let keyIdentifier = "";

	if (sessionId) {
		const session = await getSession(sessionId);
		if (session?.userId?._id) {
			keyIdentifier = `user:${session.userId._id.toString()}`;
		}
	}

	// fallback to IP if no session
	if (!keyIdentifier) {
		const ip =
			c.req.raw.headers.get("x-forwarded-for") ||
			c.req.raw.headers.get("cf-connecting-ip") ||
			c.req.raw.headers.get("x-real-ip") ||
			c.req.raw.url;

		keyIdentifier = `ip:${ip}`;
	}

	const key = `ratelimit:${keyIdentifier}`;
	const blockKey = `ratelimit:block:${keyIdentifier}`;

	// Check if blocked
	const isBlocked = await redis.get(blockKey);
	if (isBlocked) {
		const retryAfter = Number(isBlocked);
		throw new HTTPException(429, {
			message: "Too Many Requests",
			res: Response.json(
				{
					error: "Too Many Requests",
					retryAfterSeconds: retryAfter,
				},
				{
					status: 429,
					headers: {
						"Retry-After": retryAfter.toString(),
						"X-RateLimit-Limit": POINTS.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": (
							Math.floor(Date.now() / 1000) + retryAfter
						).toString(),
					},
				}
			),
		});
	}

	let current = (await redis.get<number>(key)) || 0;
	current++;

	if (current > POINTS) {
		await redis.set(blockKey, BLOCK_DURATION, { ex: BLOCK_DURATION });
		await redis.del(key);
		throw new HTTPException(429, {
			message: "Too Many Requests",
			res: Response.json(
				{
					error: "Too Many Requests",
					retryAfterSeconds: BLOCK_DURATION,
				},
				{
					status: 429,
					headers: {
						"Retry-After": BLOCK_DURATION.toString(),
						"X-RateLimit-Limit": POINTS.toString(),
						"X-RateLimit-Remaining": "0",
						"X-RateLimit-Reset": (
							Math.floor(Date.now() / 1000) + BLOCK_DURATION
						).toString(),
					},
				}
			),
		});
	}

	await redis.set(key, current, { ex: DURATION });

	c.header("X-RateLimit-Limit", POINTS.toString());
	c.header("X-RateLimit-Remaining", (POINTS - current).toString());
	c.header(
		"X-RateLimit-Reset",
		(Math.floor(Date.now() / 1000) + DURATION).toString()
	);

	await next();
};
