import { redirect } from "@tanstack/react-router";
import { authQuery } from "../api/authQuery";
// import type { ParsedLocation } from "@tanstack/react-router";
import type { RouterContext } from "@/routes/__root";

type requireAuthType = {
	context: RouterContext;
	location: any;
};

export const requireAuth = async ({ context, location }: requireAuthType) => {
	const { queryClient } = context;

	try {
		const authData = await queryClient.ensureQueryData(authQuery);
		if (!authData.authenticated) {
			throw redirect({ to: "/auth", search: { redirect: location.href } });
		}
	} catch {
		throw redirect({ to: "/auth", search: { redirect: location.href } });
	}
};

export const checkAuth = async ({ context, location }: requireAuthType) => {
	const { queryClient } = context;

	try {
		const authData = await queryClient.ensureQueryData(authQuery);
		if (authData.authenticated) {
			throw redirect({ to: "/auth", search: { redirect: location.href } });
		}
		return authData;
	} catch {
		return;
	}
};
