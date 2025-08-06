// Sign-out / Logout User
import { getCookie, deleteCookie } from "hono/cookie";
import { deleteSession } from "@/modules/auth/service/session.service.js";
import type { Context } from "hono";

export const SignOutController = async (c: Context) => {
	const sessionId = getCookie(c, "sessionId");
	if (sessionId) {
		await deleteSession(sessionId);
		deleteCookie(c, "sessionId");
		return c.json({ message: "User Successfully Logged out" });
	}

	return c.json({ message: "User is Not Logged In" }, 400);
};
