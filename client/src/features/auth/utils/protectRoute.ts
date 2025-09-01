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

		console.log("requireAuth", authData);
		if (!authData || !authData.isAuthenticated) {
			throw redirect({ to: "/auth", search: { redirect: location.href } });
		}
		return authData;
	} catch (error) {
		// If there's any error (network, server, etc.), redirect to auth
		console.warn("Authentication check failed:", error);
		throw redirect({ to: "/auth", search: { redirect: location.href } });
	}
};
