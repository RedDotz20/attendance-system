import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { ErrorComponent } from "@/components/ErrorComponent";
import { authQuery } from "@/features/auth/api/authQuery";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
// import Header from "../components/Header";

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
			// Prefetch auth data for better UX, but don't redirect here
			const authData = await context.queryClient.fetchQuery(authQuery);
			console.log("Auth data in root:", authData);
			return authData;
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
	notFoundComponent: () => <h1>NOT FOUND</h1>,
});
