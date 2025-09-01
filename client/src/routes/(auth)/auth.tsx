import { createFileRoute, redirect } from "@tanstack/react-router";
import type { AuthState } from "@/features/auth/types/auth.type";
import { AuthService } from "@/features/auth/services/auth.service";
import AuthPage from "@/features/auth";

export const Route = createFileRoute("/(auth)/auth")({
	beforeLoad: async ({ context, location }) => {
		const { queryClient } = context;

		try {
			const authData = await queryClient.ensureQueryData({
				queryKey: AuthService.AUTH_QUERY_KEY,
				queryFn: AuthService.getCurrentUser,
			});

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
			const cachedAuthData = queryClient.getQueryData<AuthState>(
				AuthService.AUTH_QUERY_KEY
			);

			if (cachedAuthData?.isAuthenticated) {
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
