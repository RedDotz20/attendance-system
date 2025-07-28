import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { authQuery } from "@/features/auth/api/authQuery";
import AuthPage from "@/features/auth";

export const Route = createFileRoute("/(auth)/auth")({
	beforeLoad: async ({ context }) => {
		const authData = await context.queryClient.fetchQuery(authQuery);

		if (authData.authenticated) {
			throw redirect({ to: "/dashboard", search: { redirect: true } });
		}

		return authData;
	},
	component: AuthPage,
});
