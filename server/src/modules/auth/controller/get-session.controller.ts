import { getCookie, deleteCookie } from "hono/cookie";
import { User } from "@/modules/users/models/user.model.js";
import type { Context } from "hono";
import {
	deleteSession,
	getSession,
} from "@/modules/auth/service/session.service.js";
import { success } from "@/shared/utils/response.js";

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
			return success(
				c,
				{
					isAuthenticated: false,
					user: null,
				},
				"No session found"
			);
		}

		const session = await getSession(sessionId);

		if (!session) {
			// Clean up invalid cookie
			deleteCookie(c, "sessionId");
			return success(
				c,
				{
					isAuthenticated: false,
					user: null,
				},
				"Invalid or expired session"
			);
		}

		const user = await User.findById(session.userId).lean<{
			_id: any;
			name: string;
			email: string;
			role: string;
			createdAt: Date;
			updatedAt: Date;
		}>();

		if (!user) {
			// Clean up session for non-existent user
			await deleteSession(sessionId);
			deleteCookie(c, "sessionId");
			return success(
				c,
				{
					isAuthenticated: false,
					user: null,
				},
				"User no longer exists"
			);
		}

		return success(
			c,
			{
				isAuthenticated: true,
				user: {
					id: user._id.toString(),
					name: user.name,
					email: user.email,
					role: user.role,
					createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
					updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : new Date().toISOString(),
				},
			},
			"User successfully authenticated"
		);
	} catch (error) {
		console.error("Session validation error:", error);
		return success(
			c,
			{
				isAuthenticated: false,
				user: null,
			},
			"Session validation failed"
		);
	}
};
