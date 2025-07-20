import { Session } from "../models/Session.js";
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
