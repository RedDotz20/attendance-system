import { queryOptions } from "@tanstack/react-query";
import { fetchAuthQuery } from "@/features/auth/api/authQuery";

export const authQuery = queryOptions({
	queryKey: ["auth", "me"],
	queryFn: fetchAuthQuery,
	staleTime: 1000 * 60 * 10, // Cache for 10 minutes
	refetchOnWindowFocus: false, // Do not refetch when window gains focus
	retry: false, // Do not retry if unauthorized
});
