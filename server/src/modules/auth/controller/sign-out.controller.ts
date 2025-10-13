// Sign-out / Logout User
import { getCookie, deleteCookie } from "hono/cookie";
import { deleteSession } from "@/modules/auth/service/session.service.js";
import type { Context } from "hono";
import { success, error } from "@/shared/utils/response.js";

export const SignOutController = async (c: Context) => {
	const sessionId = getCookie(c, "sessionId");
	if (sessionId) {
		await deleteSession(sessionId);
		deleteCookie(c, "sessionId");
		return success(c, { message: "User successfully logged out" }, "Logged out successfully");
	}

	return error(c, "User is not logged in", "NOT_LOGGED_IN", 400);
};
