import { Hono } from "hono";
import { User } from "../models/User.js";

export const authRoute = new Hono();

authRoute.post("/register", async (c) => {
	const { username, password, role } = await c.req.json();
	const exists = await User.findOne({ username });
	if (exists) return c.text("User exists", 400);

	const user = await User.create({ username, password, role });
	return c.json({
		message: "User created",
		user: { username: user.username, role: user.role },
	});
});

authRoute.post("/login", async (c) => {
	const { username, password } = await c.req.json();
	const user = await User.findOne({ username, password });
	if (!user) return c.text("Invalid credentials", 401);

	const session = c.get("session" as keyof typeof c.var) as {
		set: (data: Record<string, any>) => Promise<void>;
		destroy?: () => Promise<void>;
	};
	await session.set({
		userId: user._id.toString(),
		username: user.username,
		role: user.role,
	});

	return c.json({ message: "Logged in", role: user.role });
});

authRoute.post("/logout", async (c) => {
	const session = c.get("session" as keyof typeof c.var) as {
		set: (data: Record<string, any>) => Promise<void>;
		destroy?: () => Promise<void>;
	};
	if (session.destroy) {
		await session.destroy();
	}
	return c.json({ message: "Logged out" });
});
