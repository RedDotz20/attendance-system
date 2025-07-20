import { Outlet, Navigate } from "@tanstack/react-router";
import { useAuthQuery } from "@/hooks/useAuthQuery";

export function ProtectedLayout() {
	const { data: user, isError } = useAuthQuery();

	if (isError || !user)
		return (
			<Navigate
				to="/sign-in"
				replace
			/>
		);

	return <Outlet />;
}
