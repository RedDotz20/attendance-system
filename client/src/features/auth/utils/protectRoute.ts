import { redirect } from "@tanstack/react-router";
import { authQuery } from "../api/queries";
import type { RouterContext } from "@/routes/__root";

type requireAuthType = {
	context: RouterContext;
	location: any;
};

export const requireAuth = async ({ context, location }: requireAuthType) => {
	const { queryClient } = context;

	try {
		const authData = await queryClient.ensureQueryData(authQuery);
		if (!authData.isAuthenticated) {
			throw redirect({ to: "/auth", search: { redirect: location.href } });
		}
	} catch {
		throw redirect({ to: "/auth", search: { redirect: location.href } });
	}
};
