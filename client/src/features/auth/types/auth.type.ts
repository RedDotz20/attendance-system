import type { RouterContext } from "@/routes/__root";
import type {
	UserWithTimestamps,
	LoginCredentials,
	RegisterCredentials,
} from "@/types/user.type";

// Authentication state type (updated to match server responses)
export interface AuthState {
	isAuthenticated: boolean;
	user: UserWithTimestamps | null;
	message?: string;
}

// Authentication response type for login (matches server response structure)
export interface AuthResponse {
	user: UserWithTimestamps;
	isAuthenticated: boolean;
	message?: string;
}

// Sign in credentials (matches server)
export interface SignInCredentials extends LoginCredentials {}

// Sign up credentials (matches server)
export interface SignUpCredentials extends RegisterCredentials {}

// Session response (matches server)
export interface SessionResponse extends AuthResponse {}

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

// Auth error types for better error handling
export interface AuthError {
	code: string;
	message: string;
	field?: string;
}

// Role-based access control types
export interface RoleGuardParams extends ProtectedRouteParams {
	requiredRole?: string;
	allowAdmin?: boolean;
}
