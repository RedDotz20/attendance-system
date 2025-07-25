import { queryOptions, mutationOptions } from "@tanstack/react-query";

// ---------- Fetch Authenticated User ----------
export const fetchAuthQuery = async () => {
	const res = await fetch("http://localhost:3000/auth/me", {
		credentials: "include",
	});

	const user = (await res.json()) as Promise<{
		user: { id: string; name: string; email: string; role: string };
		authenticated: boolean;
	}>;

	if (res.status === 500) {
		throw new Error(`Server Error: ${res.status} ${res.statusText}`);
	}

	return user;
};

export const authQuery = queryOptions({
	queryKey: ["auth", "me"],
	queryFn: fetchAuthQuery,
	staleTime: 1000 * 60 * 10, // Cache for 10 minutes
	refetchOnWindowFocus: false, // Do not refetch when window gains focus
	retry: false, // Do not retry if unauthorized
});

// ---------- Login (Sign In) ----------
export const loginFn = async (input: { email: string; password: string }) => {
	const res = await fetch("http://localhost:3000/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		throw new Error("Invalid credentials");
	}
	return await res.json();
};

export const loginMutation = mutationOptions({
	mutationKey: ["auth", "login"],
	mutationFn: loginFn,
});

// ---------- Register (Sign Up) ----------
export const registerFn = async (input: {
	name: string;
	email: string;
	password: string;
}) => {
	const res = await fetch("http://localhost:3000/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) {
		throw new Error("Registration failed");
	}
	return await res.json();
};

export const registerMutation = mutationOptions({
	mutationKey: ["auth", "register"],
	mutationFn: registerFn,
});

// ---------- Logout ----------
export const logoutFn = async () => {
	const res = await fetch("http://localhost:3000/logout", {
		method: "POST",
		credentials: "include",
	});
	if (!res.ok) {
		throw new Error("Logout failed");
	}
	return await res.json();
};

export const logoutMutation = mutationOptions({
	mutationKey: ["auth", "logout"],
	mutationFn: logoutFn,
});
