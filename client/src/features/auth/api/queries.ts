import { queryOptions } from "@tanstack/react-query";
import api from "../../../lib/axios";

export const getSessionQuery = async () => {
	const res = await api.get("/auth/me");
	const user = res.data as {
		user: { id: string; name: string; email: string; role: string };
		isAuthenticated: boolean;
	};

	return user;
};

export const authQuery = queryOptions({
	queryKey: ["auth", "me"],
	queryFn: getSessionQuery,
	staleTime: 1000 * 60 * 10, // Cache for 10 minutes
	refetchOnWindowFocus: false, // Do not refetch when window gains focus
	retry: false, // Do not retry if unauthorized
});
