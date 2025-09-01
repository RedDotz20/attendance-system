import { Session } from "@/modules/auth/models/session.model.js";
import crypto from "crypto";

export async function createSession(userId: string) {
	const sessionId = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

	await Session.create({ userId, sessionId, expiresAt });
	return { sessionId, expiresAt };
}

export async function getSession(sessionId: string) {
	const session = await Session.findOne({ sessionId }).populate("userId");
	if (!session || session.expiresAt < new Date()) return null;
	return session;
}

export async function deleteSession(sessionId: string) {
	await Session.deleteOne({ sessionId });
}

// Make sure your cookie options include:
const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production", // Only secure in production
	sameSite: "lax" as const, // Important for cross-browser compatibility
	maxAge: 24 * 60 * 60 * 1000, // 24 hours
	path: "/",
};
