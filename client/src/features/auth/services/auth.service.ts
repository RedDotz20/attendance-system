import { redirect } from "@tanstack/react-router";
import { ApiClient } from "@/lib/api-client";
import apiAuth from "@/lib/axios-auth";
import type {
	AuthState,
	AuthResponse,
	SignInCredentials,
	SignUpCredentials,
	ProtectedRouteParams,
} from "../types/auth.type";

/**
 * Standalone function to fetch current user data from API
 * This is separate from the class to avoid 'this' context issues in React Query
 * Returns unauthenticated state instead of throwing on auth failure
 */
const fetchCurrentUserData = async (): Promise<AuthState> => {
	try {
		const response = await ApiClient.get<AuthState>("/auth/me");
		// Server returns success with isAuthenticated: false if no session
		return response;
	} catch (error) {
		// On any error (network, server down, etc), return unauthenticated
		console.warn("Auth check failed:", error);
		return {
			user: null,
			isAuthenticated: false,
		};
	}
};

/**
 * Service class for handling authentication operations
 */
export class AuthService {
	public static readonly AUTH_QUERY_KEY = ["auth", "me"] as const;

	// API endpoints
	private static readonly ENDPOINTS = {
		SIGN_IN: "/auth/signin",
		SIGN_UP: "/auth/signup",
		SIGN_OUT: "/auth/logout",
		ME: "/auth/me",
	} as const;

	/**
	 * Sign in user with email and password
	 */
	static async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
		return ApiClient.post<AuthResponse, SignInCredentials>(
			AuthService.ENDPOINTS.SIGN_IN,
			credentials
		);
	}

	/**
	 * Register new user (requires API key)
	 */
	static async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
		// Use apiAuth which includes API key header
		const response = await apiAuth.post<{ success: boolean; data: AuthResponse }>(
			AuthService.ENDPOINTS.SIGN_UP,
			credentials
		);
		return response.data.data;
	}

	/**
	 * Sign out current user
	 */
	static async signOut(): Promise<{ message: string }> {
		return ApiClient.post<{ message: string }>(AuthService.ENDPOINTS.SIGN_OUT);
	}

	/**
	 * Get current authenticated user
	 * Uses the standalone function to avoid context issues
	 */
	static async getCurrentUser(): Promise<AuthState> {
		return fetchCurrentUserData();
	}

	/**
	 * Protect route by ensuring user is authenticated
	 */
	static async protectRoute({
		context,
		location,
	}: ProtectedRouteParams): Promise<AuthState> {
		const { queryClient } = context;

		try {
			const authData = await queryClient.ensureQueryData({
				queryKey: AuthService.AUTH_QUERY_KEY,
				queryFn: fetchCurrentUserData, // Use the standalone function directly
			});

			if (!authData?.isAuthenticated) {
				throw redirect({
					to: "/auth",
					search: { redirect: location.href },
				});
			}

			return authData;
		} catch (error) {
			// Handle redirect errors by re-throwing them
			// Check for TanStack Router redirect objects
			if (
				error &&
				typeof error === "object" &&
				("to" in error || "href" in error)
			) {
				throw error;
			}

			// Authentication failed, redirect to auth page
			throw redirect({
				to: "/auth",
				search: { redirect: location.href },
			});
		}
	}
}
