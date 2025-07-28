import React from "react";

export const TanStackRouterDevtools =
	process.env.NODE_ENV === "production"
		? () => null // Render nothing in production
		: React.lazy(async () => {
				const res = await import("@tanstack/react-router-devtools");
				return {
					default: res.TanStackRouterDevtools,
				};
		  }); // Lazy load in development

export const ReactQueryDevtools =
	process.env.NODE_ENV === "production"
		? () => null // Render nothing in production
		: React.lazy(async () => {
				const res = await import("@tanstack/react-query-devtools");
				return {
					default: res.ReactQueryDevtools,
				};
		  }); // Lazy load in development
