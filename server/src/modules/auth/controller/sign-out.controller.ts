// Sign-out / Logout User
import { getCookie, deleteCookie } from "hono/cookie";
import { deleteSession, sessionService } from "@/modules/auth/service/session.service.js";
import type { Context } from "hono";
import { success } from "@/shared/utils/response.js";

export const SignOutController = async (c: Context) => {
	const sessionId = getCookie(c, "sessionId");
	if (sessionId) {
		await deleteSession(sessionId);
		const cookieOptions = sessionService.getCookieOptions();
		deleteCookie(c, "sessionId", cookieOptions);
		return success(c, { message: "User successfully logged out" }, "Logged out successfully");
	}

	// Gracefully handle already logged out state
	const cookieOptions = sessionService.getCookieOptions();
	deleteCookie(c, "sessionId", cookieOptions);
	return success(c, { message: "Already logged out" }, "No active session");
};
