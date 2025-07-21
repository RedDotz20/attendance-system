import { Hono } from "hono";

import {
	GetSessionUserController,
	LogOutController,
	SignInController,
	SignUpController,
} from "@/modules/auth/controller/auth.controller.js";

export const auth = new Hono();

auth.post("/signup", SignUpController);
auth.post("/signin", SignInController);

auth.get("/me", GetSessionUserController);

auth.post("/logout", LogOutController);
