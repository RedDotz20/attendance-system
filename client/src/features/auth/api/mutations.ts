import { mutationOptions } from "@tanstack/react-query";
import api from "../../../lib/axios";

// ---------- Login (Sign In) ----------
export const signInFn = async (input: { email: string; password: string }) => {
	try {
		const res = await api.post("/auth/signin", input);
		return res.data;
	} catch (error: any) {
		throw new Error("Invalid credentials");
	}
};

export const signInMutation = mutationOptions({
	mutationKey: ["auth", "login"],
	mutationFn: signInFn,
});

// ---------- Register (Sign Up) ----------
export const signUpFn = async (input: {
	name: string;
	email: string;
	password: string;
}) => {
	try {
		const res = await api.post("/register", input);
		return res.data;
	} catch (error: any) {
		throw new Error("Registration failed");
	}
};

export const signUpMutation = mutationOptions({
	mutationKey: ["auth", "register"],
	mutationFn: signUpFn,
});

// ---------- Logout (Sign Out) ----------
export const signOutFn = async () => {
	try {
		const res = await api.post("/auth/logout");
		return res.data;
	} catch (error: any) {
		throw new Error("Logout failed");
	}
};

export const signOutMutation = mutationOptions({
	mutationKey: ["auth", "logout"],
	mutationFn: signOutFn,
});
