import { useQuery } from "@tanstack/react-query";

export function useAuthQuery() {
	return useQuery({
		queryKey: ["auth", "me"],
		queryFn: async () => {
			const res = await fetch("http://localhost:3000/auth/me", {
				credentials: "include",
			});

			if (!res.ok) throw new Error("Unauthorized");
			const data = await res.json();
			return data.user;
		},
		retry: false,
		staleTime: 1000 * 60 * 5, // cache for 5 min
	});
}
