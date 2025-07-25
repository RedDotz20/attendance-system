import { Outlet, Navigate } from "@tanstack/react-router";
import { authQuery } from "@/hooks/useAuthQuery";
import { useQuery } from "@tanstack/react-query";

export function AdminLayout() {
	const { data, isLoading, isError } = useQuery(authQuery);
	console.log("AUTH LAYOUT: ", data?.authenticated);
	if (isLoading) return <div>Loading session...</div>;
	if (isError || data?.user) return <Navigate to="/auth" />;
	if (data?.user.role !== "admin") return <Navigate to="/401" />;

	return <Outlet />;
}
