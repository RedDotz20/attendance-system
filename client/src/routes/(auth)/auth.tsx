import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { authQuery } from "@/hooks/useAuthQuery";
import AuthPage from "@/features/auth";

export const Route = createFileRoute("/(auth)/auth")({
	beforeLoad: async ({ context }) => {
		const authData = await context.queryClient.fetchQuery(authQuery);

		if (authData.authenticated) {
			throw redirect({ to: "/dashboard" });
		}

		return authData;
	},
	component: AuthPage,
});
