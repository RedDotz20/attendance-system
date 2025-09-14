/**
 * User-related types with strict typing
 */

// User roles as const assertion for better type safety
export const UserRoles = {
	ADMIN: "admin",
	USER: "user",
} as const;

export type Role = (typeof UserRoles)[keyof typeof UserRoles];

// Core user interface
export interface User {
	readonly id: string;
	name: string;
	email: string;
	role: Role;
}

// Extended user interface with timestamps
export interface UserWithTimestamps extends User {
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

// User for database operations (includes password)
export interface UserDocument extends UserWithTimestamps {
	password: string;
}

// User for API responses (excludes password)
export interface PublicUser extends UserWithTimestamps {
	// Password is intentionally omitted
}

// User creation data
export interface CreateUserData {
	name: string;
	email: string;
	password: string;
	role?: Role;
}

// User update data
export interface UpdateUserData {
	name?: string;
	email?: string;
	role?: Role;
}

// User login credentials
export interface LoginCredentials {
	email: string;
	password: string;
}

// User session data
export interface UserSession {
	userId: string;
	sessionId: string;
	expiresAt: Date;
	user?: PublicUser;
}

// Type guard to check if user is admin
export function isAdmin(user: User): boolean {
	return user.role === UserRoles.ADMIN;
}

// Type guard to check if user has specific role
export function hasRole(user: User, role: Role): boolean {
	return user.role === role;
}
