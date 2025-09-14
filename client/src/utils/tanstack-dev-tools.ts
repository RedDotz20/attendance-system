import React from "react";

export const TanStackRouterDevtools =
	import.meta.env.MODE === "production"
		? () => null // Render nothing in production
		: React.lazy(async () => {
				const res = await import("@tanstack/react-router-devtools");
				return {
					default: res.TanStackRouterDevtools,
				};
		  }); // Lazy load in development

export const ReactQueryDevtools =
	import.meta.env.MODE === "production"
		? () => null // Render nothing in production
		: React.lazy(async () => {
				const res = await import("@tanstack/react-query-devtools");
				return {
					default: res.ReactQueryDevtools,
				};
		  }); // Lazy load in development
