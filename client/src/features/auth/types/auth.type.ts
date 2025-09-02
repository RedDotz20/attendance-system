import type { RouterContext } from "@/routes/__root";

// User entity type
export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
}

// Authentication state type
export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	message?: string;
}

// Authentication response type for login/register
export interface AuthResponse {
	user: User;
	token?: string;
	message?: string;
}

// Sign in credentials
export interface SignInCredentials {
	email: string;
	password: string;
}

// Sign up credentials
export interface SignUpCredentials extends SignInCredentials {
	name: string;
}

// Protected route parameters
export interface ProtectedRouteParams {
	context: RouterContext;
	location: {
		href: string;
		pathname: string;
		search: Record<string, unknown>;
		hash: string;
	};
}
