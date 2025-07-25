import React, { useState, useEffect, createContext, useCallback } from "react";

interface User {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface AuthContextType {
	user: User | null;
	authenticated: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [authenticated, setAuthenticated] = useState<boolean>(false);

	const fetchUser = useCallback(async () => {
		try {
			const res = await fetch("/auth/me", {
				credentials: "include", // include cookies/session
			});
			if (res.ok) {
				const data = await res.json();
				setUser(data.user);
				setAuthenticated(data.authenticated);
			} else {
				setUser(null);
				setAuthenticated(false);
			}
		} catch (error) {
			console.error("Failed to fetch user", error);
			setUser(null);
			setAuthenticated(false);
		}
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	const login = async (email: string, password: string) => {
		const res = await fetch("/auth/signin", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});

		if (!res.ok) {
			throw new Error("Login failed");
		}

		await fetchUser();
	};

	const logout = async () => {
		await fetch("/auth/logout", {
			method: "POST",
			credentials: "include",
		});
		setUser(null);
		setAuthenticated(false);
	};

	const value: AuthContextType = {
		user,
		authenticated,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = React.useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
