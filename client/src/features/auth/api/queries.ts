import { queryOptions } from "@tanstack/react-query";
import api from "@/lib/axios";

export const getSessionQuery = async () => {
	try {
		const res = await api.get("/auth/me");

		const data = res.data as {
			isAuthenticated: boolean;
			user: { id: string; name: string; email: string; role: string } | null;
			message?: string;
		};

		console.log(data);

		return {
			isAuthenticated: data.isAuthenticated,
			user: data.user,
			message: data.message,
		};
	} catch (error: any) {
		console.warn("Authentication check failed:", error);
		return {
			user: null,
			isAuthenticated: false,
		};
	}
};

export const authQuery = queryOptions({
	queryKey: ["auth", "me"],
	queryFn: getSessionQuery,
	staleTime: 1000 * 60 * 5, // Cache for 5 minutes (reduced from 10)
	refetchOnWindowFocus: true, // Refetch when window gains focus (changed from false)
	retry: 1, // Retry once if request fails (changed from false)
	// retryDelay: 1000, // Wait 1 second before retrying
});
