import React from "react";
import {
	Outlet,
	createRootRouteWithContext,
	redirect,
} from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorComponent } from "../components/ErrorComponent";
import { authQuery } from "@/features/auth/api/authQuery";
import Header from "../components/Header";
import { Toaster } from "react-hot-toast";

// Lazy load in development
const importReactRouterDevTools = async () => {
	const res = await import("@tanstack/react-router-devtools");
	return {
		default: res.TanStackRouterDevtools,
	};
};

const TanStackRouterDevtools =
	process.env.NODE_ENV === "production"
		? () => null // Render nothing in production
		: React.lazy(importReactRouterDevTools); // Lazy load in development

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
}

export interface AuthContext {
	user?: User;
	authenticated: boolean;
}

export interface RouterContext {
	queryClient: QueryClient;
	// auth: AuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context }) => {
		try {
			const authData = await context.queryClient.fetchQuery(authQuery);

			console.log(authData);

			if (authData.authenticated) {
				throw redirect({
					to: "/dashboard",
					search: { redirect: location.href },
				});
			}
			return authData;
		} catch {
			// context.auth = { authenticated: false };
		}
	},
	component: () => {
		return (
			<>
				<Header />
				<Outlet />
				<Toaster position="top-center" />
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
