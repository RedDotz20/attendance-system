/**
 * User-related types that match the server's user types
 * These should be kept in sync with the server's user types
 */

// User roles as const assertion for better type safety (matches server)
export const UserRoles = {
	ADMIN: "admin",
	USER: "user",
} as const;

export type Role = (typeof UserRoles)[keyof typeof UserRoles];

// Core user interface (matches server PublicUser)
export interface User {
	readonly id: string;
	name: string;
	email: string;
	role: Role;
}

// Extended user interface with timestamps (matches server)
export interface UserWithTimestamps extends User {
	readonly createdAt: string; // ISO string from API
	readonly updatedAt: string; // ISO string from API
}

// User creation data (matches server)
export interface CreateUserData {
	name: string;
	email: string;
	password: string;
	role?: Role;
}

// User update data (matches server)
export interface UpdateUserData {
	name?: string;
	email?: string;
	role?: Role;
}

// User login credentials (matches server)
export interface LoginCredentials {
	email: string;
	password: string;
}

// User registration credentials
export interface RegisterCredentials extends LoginCredentials {
	name: string;
	role?: Role;
}

// User session data (matches server)
export interface UserSession {
	userId: string;
	sessionId: string;
	expiresAt: string; // ISO string from API
	user?: UserWithTimestamps;
}

// Type guard to check if user is admin
export function isAdmin(user: User): boolean {
	return user.role === UserRoles.ADMIN;
}

// Type guard to check if user has specific role
export function hasRole(user: User, role: Role): boolean {
	return user.role === role;
}

// Type guard to check if user can access admin features
export function canAccessAdmin(user: User): boolean {
	return isAdmin(user);
}

// Type guard to check if user can access user features
export function canAccessUser(user: User): boolean {
	return user.role === UserRoles.USER || isAdmin(user);
}
