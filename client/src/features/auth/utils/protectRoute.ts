// src/features/auth/utils/protectRoute.ts
import { redirect } from "@tanstack/react-router";
import { authQuery } from "../api/authQuery";

type requireAuthType = {
	context: any;
	location: any;
};

export const requireAuth = async ({ context, location }: requireAuthType) => {
	const { queryClient } = context;

	try {
		const authData = await queryClient.ensureQueryData(authQuery);
		if (!authData.authenticated) {
			throw redirect({ to: "/auth", search: { redirect: location.href } });
		}
		return authData;
	} catch {
		throw redirect({ to: "/auth", search: { redirect: location.href } });
	}
};
