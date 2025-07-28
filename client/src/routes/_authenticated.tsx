import { requireAuth } from "@/features/auth/utils/protectRoute";
import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
// import { SidebarProvider } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: requireAuth,
	component: AuthenticatedRouteLayout,
});

function AuthenticatedRouteLayout() {
	return (
		<>
			{/* Todo: Add navigation Bar */}
			{/* <SidebarProvider>
			</SidebarProvider> */}
			<Outlet />
		</>
	);
}
