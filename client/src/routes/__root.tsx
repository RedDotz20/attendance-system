import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { ErrorComponent } from "@/components/ErrorComponent";
// import { authQuery } from "@/features/auth/api/queries";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { type QueryClient } from "@tanstack/react-query";
import { AuthService } from "@/features/auth/services/auth.service";

import {
	ReactQueryDevtools,
	TanStackRouterDevtools,
} from "@/utils/tanstack-dev-tools";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context }) => {
		try {
			// Prefetch auth data
			return await context.queryClient.fetchQuery({
				queryKey: AuthService.AUTH_QUERY_KEY,
				queryFn: AuthService.getCurrentUser,
			});
		} catch (error) {
			console.error("Auth fetch failed in root:", error);
			// Return a default state for unauthenticated users
			return { authenticated: false, user: null };
		}
	},
	component: () => {
		return (
			<>
				<Toaster position="top-center" />
				<ThemeProvider
					defaultTheme="dark"
					storageKey="vite-ui-theme"
				>
					<Outlet />
				</ThemeProvider>
				{import.meta.env.MODE === "development" && (
					<>
						<ReactQueryDevtools buttonPosition="bottom-left" />
						<TanStackRouterDevtools position="bottom-right" />
					</>
				)}
			</>
		);
	},
	errorComponent: ErrorComponent,
});
