import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { authQuery } from "@/features/auth/api/queries";
import AuthPage from "@/features/auth";

export const Route = createFileRoute("/(auth)/auth")({
	beforeLoad: async ({ context }) => {
		const { isAuthenticated } = await context.queryClient.fetchQuery(authQuery);

		if (isAuthenticated) {
			throw redirect({ to: "/dashboard", search: { redirect: true } });
		}
	},
	component: AuthPage,
});
