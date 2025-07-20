import { Outlet, Navigate } from "@tanstack/react-router";
import { useAuthQuery } from "@/hooks/useAuthQuery";

export function AdminLayout() {
	const { data: user, isLoading, isError } = useAuthQuery();

	if (isLoading) return <div>Loading session...</div>;
	if (isError || !user) return <Navigate to="/sign-in" />;
	if (user.role !== "admin") return <Navigate to="/401" />;

	return <Outlet />;
}
