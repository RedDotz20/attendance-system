import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { handleServerError } from "@/utils/handle-server-error.ts";
import toast from "react-hot-toast";
import LoadingPage from "@/components/LoadingPage.tsx";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import reportWebVitals from "./reportWebVitals.ts";
import {
	QueryClient,
	QueryClientProvider,
	QueryCache,
} from "@tanstack/react-query";
import { NotFound } from "@/components/NotFound.tsx";
import { ErrorComponent } from "@/components/ErrorComponent.tsx";
import "./styles.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: (failureCount, error) => {
				// eslint-disable-next-line no-console
				if (import.meta.env.DEV) console.log({ failureCount, error });

				if (failureCount >= 0 && import.meta.env.DEV) return false;
				if (failureCount > 3 && import.meta.env.PROD) return false;

				return !(
					error instanceof AxiosError &&
					[401, 403].includes(error.response?.status ?? 0)
				);
			},
			refetchOnWindowFocus: import.meta.env.PROD,
			staleTime: 10 * 1000, // 10s
		},
		mutations: {
			onError: (error) => {
				handleServerError(error);

				if (error instanceof AxiosError) {
					if (error.response?.status === 304) {
						toast.error("Content not modified!");
					}
				}
			},
		},
	},
	queryCache: new QueryCache({
		onError: (error) => {
			if (error instanceof AxiosError) {
				if (error.response?.status === 401) {
					toast.error("Session expired!");
					// useAuthStore.getState().auth.reset();
					const redirect = `${router.history.location.href}`;
					router.navigate({ to: "/auth", search: { redirect } });
				}
				if (error.response?.status === 500) {
					toast.error("Internal Server Error!");
					router.navigate({ to: "/500" });
				}
				if (error.response?.status === 403) {
					// router.navigate("/forbidden", { replace: true });
				}
			}
		},
	}),
});

// Create a new router instance
const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
	defaultPendingComponent: LoadingPage,
	defaultNotFoundComponent: NotFound,
	defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>
	);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
