import { Hono } from "hono";

import { SignUpController } from "../controller/sign-up.controller.js";
import { SignInController } from "../controller/sign-in.controller.js";
import { GetSessionUserController } from "../controller/get-session.controller.js";
import { SignOutController } from "../controller/sign-out.controller.js";

export const auth = new Hono();

auth.post("/signup", SignUpController);
auth.post("/signin", SignInController);

auth.get("/me", GetSessionUserController);

auth.post("/logout", SignOutController);
