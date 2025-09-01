import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authQuery } from "@/features/auth/api/queries";
import { signInMutation, signOutMutation } from "../api/mutations";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";

export const useAuth = () => {
	const { data: session, isLoading, isError } = useQuery(authQuery);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const signIn = useMutation({
		...signInMutation,
		onSuccess: async (loginResponse) => {
			// Directly set the query data with the login response BEFORE navigation
			queryClient.setQueryData(["auth", "me"], {
				isAuthenticated: true,
				user: loginResponse.user,
			});

			toast.success("Login Success");

			// Navigate after setting the cache data
			navigate({ to: "/dashboard" });

			// Invalidate to ensure fresh data on future requests
			queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
		},
		onError: (err: any) => {
			console.error(err.message);
			toast.error(err.message, {
				style: { border: "2px solid red" },
			});
		},
	});

	const signOut = useMutation({
		...signOutMutation,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
			navigate({ to: "/auth" });
		},
	});

	// const handleSignIn = (email: string, password: string) => {
	// 	login.mutate({ email, password });
	// };

	// const handleSignOut = () => logout.mutate();

	return {
		user: session?.user,
		isAuthenticated: session?.isAuthenticated ?? false,
		isLoading,
		isError,
		signIn,
		signOut,
	};
};
