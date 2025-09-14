/**
 * Hono context variables with strict typing
 */

import type { PublicUser } from "@/modules/users/types/user.type.js";

// Hono context variables
export interface HonoVariables {
	user: PublicUser;
	requestId?: string;
	startTime?: number;
}

// Extended Hono app type with strict variables
declare module "hono" {
	interface ContextVariableMap extends HonoVariables {}
}
