/**
 * Authentication middleware with strict typing and better error handling
 */

import type { Context, Next, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { sessionService } from "@/modules/auth/service/session.service.js";
import { UserRoles, type Role } from "@/modules/users/types/user.type.js";
import { unauthorized, forbidden } from "@/shared/utils/response.js";
import { logger } from "@/shared/utils/logger.js";

/**
 * Session authentication middleware
 * Validates session and adds user to context
 */
export const sessionAuth: MiddlewareHandler = async (
	c: Context,
	next: Next
): Promise<Response | void> => {
	try {
		const sessionId = getCookie(c, "sessionId");

		if (!sessionId) {
			logger.warn({ url: c.req.url }, "Missing session ID");
			return unauthorized(c, "Authentication required");
		}

		const sessionResult = await sessionService.getSession(sessionId);

		if (!sessionResult.success) {
			logger.warn(
				{ sessionId, error: sessionResult.error.message },
				"Invalid session"
			);
			return unauthorized(c, "Invalid or expired session");
		}

		const { user } = sessionResult.data;
		if (!user) {
			logger.warn({ sessionId }, "Session user not found");
			return unauthorized(c, "User not found");
		}

		// Add user to context
		c.set("user", user);

		// Log successful authentication
		logger.debug({ userId: user.id, sessionId }, "User authenticated");

		await next();
	} catch (error) {
		logger.error({ error }, "Session authentication error");
		return unauthorized(c, "Authentication failed");
	}
};

/**
 * Optional session authentication middleware
 * Adds user to context if session is valid, but doesn't fail if not
 */
export const optionalSessionAuth: MiddlewareHandler = async (
	c: Context,
	next: Next
) => {
	try {
		const sessionId = getCookie(c, "sessionId");

		if (sessionId) {
			const sessionResult = await sessionService.getSession(sessionId);

			if (sessionResult.success && sessionResult.data.user) {
				c.set("user", sessionResult.data.user);
			}
		}

		await next();
	} catch (error) {
		logger.warn({ error }, "Optional session authentication error");
		await next();
	}
};

/**
 * Role-based authorization middleware factory
 * @param requiredRole - The role required to access the route
 * @param allowHigherRoles - Whether higher roles (admin) can access the route
 */
export function requireRole(
	requiredRole: Role,
	allowHigherRoles: boolean = true
): MiddlewareHandler {
	return async (c: Context, next: Next): Promise<Response | void> => {
		try {
			const user = c.get("user");

			if (!user) {
				logger.warn({ url: c.req.url }, "No user in context for role check");
				return unauthorized(c, "Authentication required");
			}

			if (!user.role) {
				logger.warn({ userId: user.id }, "User has no role assigned");
				return forbidden(c, "Access denied: No role assigned");
			}

			// Check if user has the required role
			const hasRequiredRole = user.role === requiredRole;

			// Check if admin can access (if allowHigherRoles is true)
			const isAdminWithAccess =
				allowHigherRoles &&
				user.role === UserRoles.ADMIN &&
				requiredRole === UserRoles.USER;

			if (!hasRequiredRole && !isAdminWithAccess) {
				logger.warn(
					{
						userId: user.id,
						userRole: user.role,
						requiredRole,
						url: c.req.url,
					},
					"Insufficient permissions"
				);

				return forbidden(c, `Access denied: ${requiredRole} role required`);
			}

			logger.debug(
				{
					userId: user.id,
					userRole: user.role,
					requiredRole,
				},
				"Role authorization successful"
			);

			await next();
		} catch (error) {
			logger.error({ error }, "Role authorization error");
			return forbidden(c, "Authorization failed");
		}
	};
}

/**
 * Admin-only middleware
 */
export const requireAdmin: MiddlewareHandler = requireRole(
	UserRoles.ADMIN,
	false
);

/**
 * User or admin middleware
 */
export const requireUser: MiddlewareHandler = requireRole(UserRoles.USER, true);

/**
 * Self or admin middleware - allows access if user is accessing their own resource or if they're admin
 */
export function requireSelfOrAdmin(
	userIdParam: string = "id"
): MiddlewareHandler {
	return async (c: Context, next: Next) => {
		try {
			const user = c.get("user");
			const targetUserId = c.req.param(userIdParam);

			if (!user) {
				return unauthorized(c, "Authentication required");
			}

			// Allow if admin
			if (user.role === UserRoles.ADMIN) {
				return await next();
			}

			// Allow if accessing own resource
			if (user.id === targetUserId) {
				return await next();
			}

			logger.warn(
				{
					userId: user.id,
					targetUserId,
					userRole: user.role,
				},
				"Insufficient permissions for resource access"
			);

			return forbidden(c, "Access denied: Can only access own resources");
		} catch (error) {
			logger.error({ error }, "Self or admin authorization error");
			return forbidden(c, "Authorization failed");
		}
	};
}
