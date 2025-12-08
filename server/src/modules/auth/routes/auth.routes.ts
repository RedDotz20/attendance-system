import { Hono } from "hono";

import { SignUpController } from "../controller/sign-up.controller.js";
import { SignInController } from "../controller/sign-in.controller.js";
import { GetSessionUserController } from "../controller/get-session.controller.js";
import { SignOutController } from "../controller/sign-out.controller.js";
import { apiKeyAuth } from "../../../shared/middleware/api-key.middleware.js";

export const auth = new Hono();

// Signup requires API key to prevent unauthorized bot registrations (security measure)
auth.post("/signup", apiKeyAuth, SignUpController);

// Login is public - users need to be able to authenticate
auth.post("/signin", SignInController);

// Session endpoint is protected by session cookie, no API key needed for web clients
auth.get("/me", GetSessionUserController);

// Logout is public - users should always be able to log out
auth.post("/logout", SignOutController);
