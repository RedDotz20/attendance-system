import { getCookie, deleteCookie } from "hono/cookie";
import { User } from "@/modules/users/models/user.model.js";
import type { Context } from "hono";
import {
	deleteSession,
	getSession,
} from "@/modules/auth/service/session.service.js";

// Get User Session Status
interface AuthStatusResponse {
	isAuthenticated: boolean;
	user?: {
		id: string;
		name: string;
		email: string;
		role: string;
	} | null;
	message?: string;
}

export const GetSessionUserController = async (
	c: Context
): Promise<Response> => {
	try {
		const sessionId = getCookie(c, "sessionId");

		if (!sessionId) {
			return c.json<AuthStatusResponse>(
				{
					isAuthenticated: false,
					user: null,
					message: "No session found",
				},
				200 // ✅ 200 instead of 401 for status check
			);
		}

		const session = await getSession(sessionId);

		if (!session) {
			// Clean up invalid cookie
			deleteCookie(c, "sessionId");
			return c.json<AuthStatusResponse>(
				{
					isAuthenticated: false,
					user: null,
					message: "Invalid or expired session",
				},
				200 // ✅ 200 instead of 401
			);
		}

		const user = await User.findById(session.userId).lean<{
			_id: any;
			name: string;
			email: string;
			role: string;
		}>();

		if (!user) {
			// Clean up session for non-existent user
			await deleteSession(sessionId);
			deleteCookie(c, "sessionId");
			return c.json<AuthStatusResponse>(
				{
					isAuthenticated: false,
					user: null,
					message: "User no longer exists",
				},
				200 // ✅ 200 - successfully checked, user just doesn't exist
			);
		}

		return c.json<AuthStatusResponse>(
			{
				isAuthenticated: true,
				user: {
					id: user._id.toString(),
					name: user.name,
					email: user.email,
					role: user.role,
				},
				message: "User successfully authenticated",
			},
			200
		);
	} catch (error) {
		console.error("Session validation error:", error);
		return c.json<AuthStatusResponse>(
			{
				isAuthenticated: false,
				user: null,
				message: "Session validation failed",
			},
			200 // ✅ Even errors return 200 for status checks
		);
	}
};
