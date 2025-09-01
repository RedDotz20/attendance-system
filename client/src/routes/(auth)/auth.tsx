import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { authQuery } from "@/features/auth/api/queries";
import AuthPage from "@/features/auth";

export const Route = createFileRoute("/(auth)/auth")({
	beforeLoad: async ({ context, location }) => {
		const { queryClient } = context;

		try {
			const authData = await queryClient.ensureQueryData(authQuery);

			if (authData.isAuthenticated) {
				throw redirect({
					to: "/dashboard",
					search: { redirect: location.href },
				});
			}
		} catch (error) {
			// If it's a redirect, re-throw it
			if (error && typeof error === "object" && "to" in error) {
				throw error;
			}

			// Check if there's cached auth data that indicates user is authenticated
			const cachedAuthData = queryClient.getQueryData(authQuery.queryKey);
			if (cachedAuthData && cachedAuthData.isAuthenticated) {
				throw redirect({
					to: "/dashboard",
					search: { redirect: location.href },
				});
			}

			// Otherwise, continue to auth page (user is not authenticated)
			console.log("User not authenticated, proceeding to auth page");
		}
	},
	component: AuthPage,
});
