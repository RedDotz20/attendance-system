import React from "react";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import Header from "../components/Header";
import { ErrorComponent } from "../components/ErrorComponent";

interface RouterContext {
	queryClient: QueryClient;
}

const TanStackRouterDevtools =
	process.env.NODE_ENV === "production"
		? () => null // Render nothing in production
		: React.lazy(() =>
				// Lazy load in development
				import("@tanstack/router-devtools").then((res) => ({
					default: res.TanStackRouterDevtools,
					// For Embedded Mode
					// default: res.TanStackRouterDevtoolsPanel
				}))
		  );

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => {
		return (
			<>
				<Header />
				<Outlet />
				<Toaster duration={50000} />
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
