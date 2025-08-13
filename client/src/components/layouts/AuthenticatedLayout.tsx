import { Outlet } from "@tanstack/react-router";
import { TopNavigation } from "./TopNavigation";

export default function AuthenticatedLayout() {
	return (
		<div className="w-full flex flex-col items-center px-4">
			<TopNavigation />
			{/* Todo: Add navigation Bar */}
			{/* <SidebarProvider></SidebarProvider> */}
			<Outlet />
		</div>
	);
}
