/**
 * Session service with strict typing and better error handling
 */

import crypto from "crypto";
import { Session } from "@/modules/auth/models/session.model.js";
import { User } from "@/modules/users/models/user.model.js";
import type {
	UserSession,
	PublicUser,
} from "@/modules/users/types/user.type.js";
import type { Result } from "@/shared/types/common.js";
import { DatabaseError, NotFoundError } from "@/shared/utils/error-handler.js";

// Session configuration
const SESSION_CONFIG = {
	EXPIRY_DAYS: 7,
	getCookieOptions: () => ({
		httpOnly: true,
		// Always use secure: false in development with IP addresses
		secure: false,
		// Use 'lax' for better compatibility with IP addresses
		sameSite: "lax" as const,
		maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
		path: "/",
		// Domain is omitted to work with both localhost and IP addresses
	}),
} as const;

export class SessionService {
	/**
	 * Create a new session for a user
	 */
	async createSession(userId: string): Promise<Result<UserSession, Error>> {
		try {
			const sessionId = crypto.randomUUID();
			const expiresAt = new Date(
				Date.now() + SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000
			);

			// Create session in database
			await Session.create({
				userId,
				sessionId,
				expiresAt,
			});

			// Get user data for the session
			const user = await User.findById(userId);
			if (!user) {
				return { success: false, error: new NotFoundError("User") };
			}

			const publicUser: PublicUser = {
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			};

			const userSession: UserSession = {
				userId,
				sessionId,
				expiresAt,
				user: publicUser,
			};

			return { success: true, data: userSession };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to create session", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Get session by session ID
	 */
	async getSession(sessionId: string): Promise<Result<UserSession, Error>> {
		try {
			const session = await Session.findOne({ sessionId });

			if (!session) {
				return { success: false, error: new NotFoundError("Session") };
			}

			// Check if session is expired
			if (session.expiresAt < new Date()) {
				// Clean up expired session
				await this.deleteSession(sessionId);
				return { success: false, error: new NotFoundError("Session expired") };
			}

			// Get user data
			const user = await User.findById(session.userId);
			if (!user) {
				// Clean up orphaned session
				await this.deleteSession(sessionId);
				return { success: false, error: new NotFoundError("User not found") };
			}

			const publicUser: PublicUser = {
				id: user._id.toString(),
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			};

			const userSession: UserSession = {
				userId: session.userId.toString(),
				sessionId: session.sessionId,
				expiresAt: session.expiresAt,
				user: publicUser,
			};

			return { success: true, data: userSession };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to get session", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Delete a session
	 */
	async deleteSession(sessionId: string): Promise<Result<void, Error>> {
		try {
			await Session.deleteOne({ sessionId });
			return { success: true, data: undefined };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to delete session", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Delete all sessions for a user (logout from all devices)
	 */
	async deleteAllUserSessions(userId: string): Promise<Result<number, Error>> {
		try {
			const result = await Session.deleteMany({ userId });
			return { success: true, data: result.deletedCount || 0 };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to delete user sessions", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions(): Promise<Result<number, Error>> {
		try {
			const result = await Session.deleteMany({
				expiresAt: { $lt: new Date() },
			});
			return { success: true, data: result.deletedCount || 0 };
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to cleanup sessions", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Extend session expiry
	 */
	async extendSession(sessionId: string): Promise<Result<UserSession, Error>> {
		try {
			const expiresAt = new Date(
				Date.now() + SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000
			);

			const session = await Session.findOneAndUpdate(
				{ sessionId },
				{ expiresAt },
				{ new: true }
			);

			if (!session) {
				return { success: false, error: new NotFoundError("Session") };
			}

			// Get updated session data
			return this.getSession(sessionId);
		} catch (error) {
			return {
				success: false,
				error: new DatabaseError("Failed to extend session", {
					originalError: error,
				}),
			};
		}
	}

	/**
	 * Get session cookie options
	 */
	getCookieOptions() {
		return SESSION_CONFIG.getCookieOptions();
	}
}

// Export singleton instance
export const sessionService = new SessionService();

// Export legacy functions for backward compatibility
export async function createSession(userId: string) {
	const result = await sessionService.createSession(userId);
	if (!result.success) {
		throw result.error;
	}
	return { sessionId: result.data.sessionId, expiresAt: result.data.expiresAt };
}

export async function getSession(sessionId: string) {
	const result = await sessionService.getSession(sessionId);
	if (!result.success) {
		return null;
	}
	return result.data;
}

export async function deleteSession(sessionId: string) {
	const result = await sessionService.deleteSession(sessionId);
	if (!result.success) {
		throw result.error;
	}
}
