/**
 * Sign-in controller with strict typing and improved error handling
 */

import { setCookie, getCookie } from "hono/cookie";
import type { Context } from "hono";
import { sessionService } from "@/modules/auth/service/session.service.js";
import { userService } from "@/modules/users/service/user.service.js";
import {
	SignInSchema,
	type SignInInput,
} from "@/modules/users/validators/user.validator.js";
import {
	success,
	validationError,
	unauthorized,
} from "@/shared/utils/response.js";
import { logger } from "@/shared/utils/logger.js";
import { isSuccess } from "@/shared/types/common.js";

/**
 * Sign-In / Login User Controller
 */
export const SignInController = async (c: Context): Promise<Response> => {
	try {
		// Check if user is already signed in
		const existingSessionId = getCookie(c, "sessionId");
		if (existingSessionId) {
			const sessionResult = await sessionService.getSession(existingSessionId);
			if (sessionResult.success && sessionResult.data.user) {
				logger.info(
					{ userId: sessionResult.data.user.id },
					"User already signed in"
				);
				return success(
					c,
					{
						user: sessionResult.data.user,
						isAuthenticated: true,
					},
					"Already signed in"
				);
			}
		}

		// Parse and validate request body
		const body = await c.req.json();
		const validationResult = SignInSchema.safeParse(body);

		if (!validationResult.success) {
			const errors = validationResult.error.issues.map((err) => ({
				field: err.path.join("."),
				message: err.message,
				code: err.code,
			}));

			logger.warn({ errors }, "Sign-in validation failed");
			return validationError(c, errors);
		}

		const { email, password }: SignInInput = validationResult.data;

		logger.info({ email }, "Attempting to authenticate user");

		// Authenticate user
		const authResult = await userService.authenticateUser(email, password);
		logger.info(
			{
				email,
				authSuccess: authResult.success,
				...(authResult.success ? {} : { error: authResult.error?.message }),
			},
			"Authentication result"
		);

		if (!isSuccess(authResult)) {
			logger.warn({ email }, "Authentication failed");
			return unauthorized(c, "Invalid email or password");
		}

		const user = authResult.data;
		logger.info(
			{ userId: user.id, email: user.email },
			"User authenticated successfully"
		);

		// Create session
		const sessionResult = await sessionService.createSession(user.id);
		if (!isSuccess(sessionResult)) {
			logger.error(
				{ userId: user.id, error: sessionResult.error },
				"Failed to create session"
			);
			return unauthorized(c, "Failed to create session");
		}

		const { sessionId } = sessionResult.data;

		// Set session cookie
		const cookieOptions = sessionService.getCookieOptions();
		setCookie(c, "sessionId", sessionId, cookieOptions);

		logger.info(
			{
				userId: user.id,
				email: user.email,
				sessionId,
			},
			"User signed in successfully"
		);

		return success(
			c,
			{
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
				isAuthenticated: true,
			},
			"Signed in successfully"
		);
	} catch (error) {
		logger.error(
			{
				error:
					error instanceof Error
						? {
								name: error.name,
								message: error.message,
								stack: error.stack,
						  }
						: error,
			},
			"Sign-in controller error"
		);
		return unauthorized(c, "Sign-in failed");
	}
};
