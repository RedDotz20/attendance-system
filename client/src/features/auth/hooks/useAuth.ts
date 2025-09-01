import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { AuthService } from "../services/auth.service";
import type {
	SignInCredentials,
	SignUpCredentials,
	AuthResponse,
	AuthState,
	User,
} from "../types/auth.type";

/**
 * Authentication hook providing auth state and operations
 */
export const useAuth = () => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	// Fetch current authentication state
	const {
		data: authData,
		isLoading: isAuthLoading,
		error: authError,
	} = useQuery({
		queryKey: AuthService.AUTH_QUERY_KEY,
		queryFn: AuthService.getCurrentUser,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: false,
	});

	/**
	 * Handle mutation errors with consistent error display
	 */
	const handleError = (error: Error) => {
		console.error("Auth error:", error.message);
		toast.error(error.message, {
			style: { border: "2px solid red" },
		});
	};

	/**
	 * Handle successful authentication by updating query cache
	 */
	const handleAuthSuccess = (authResponse: AuthResponse) => {
		const authState: AuthState = {
			isAuthenticated: true,
			user: authResponse.user,
			message: authResponse.message,
		};

		// Update query cache immediately
		queryClient.setQueryData(AuthService.AUTH_QUERY_KEY, authState);
	};

	// Sign in mutation
	const signInMutation = useMutation({
		mutationKey: ["auth", "signin"],
		mutationFn: (credentials: SignInCredentials) =>
			AuthService.signIn(credentials),
		onSuccess: async (authResponse: AuthResponse) => {
			handleAuthSuccess(authResponse);

			toast.success("Login successful");

			// Navigate to dashboard
			await navigate({ to: "/dashboard" });

			// Invalidate queries to ensure fresh data
			await queryClient.invalidateQueries({
				queryKey: AuthService.AUTH_QUERY_KEY,
			});
		},
		onError: handleError,
	});

	// Sign up mutation
	const signUpMutation = useMutation({
		mutationKey: ["auth", "signup"],
		mutationFn: (credentials: SignUpCredentials) =>
			AuthService.signUp(credentials),
		onSuccess: async (authResponse: AuthResponse) => {
			handleAuthSuccess(authResponse);

			toast.success("Registration successful");

			// Navigate to dashboard
			await navigate({ to: "/dashboard" });

			// Invalidate queries to ensure fresh data
			await queryClient.invalidateQueries({
				queryKey: AuthService.AUTH_QUERY_KEY,
			});
		},
		onError: handleError,
	});

	// Sign out mutation
	const signOutMutation = useMutation({
		mutationKey: ["auth", "signout"],
		mutationFn: AuthService.signOut,
		onSuccess: async () => {
			// Clear auth data from cache
			queryClient.setQueryData(AuthService.AUTH_QUERY_KEY, {
				user: null,
				isAuthenticated: false,
			});

			toast.success("Logged out successfully");

			// Navigate to auth page
			await navigate({ to: "/auth" });

			// Invalidate all queries to clear any cached data
			await queryClient.invalidateQueries();
		},
		onError: handleError,
	});

	// Computed values
	const isAuthenticated = Boolean(authData?.user && authData.isAuthenticated);
	const user: User | null = authData?.user || null;
	const isLoading =
		isAuthLoading ||
		signInMutation.isPending ||
		signUpMutation.isPending ||
		signOutMutation.isPending;

	return {
		// Auth state
		user,
		isAuthenticated,
		isLoading,
		authError,

		// Actions
		signIn: signInMutation.mutateAsync,
		signUp: signUpMutation.mutateAsync,
		signOut: () => signOutMutation.mutate(),

		// Mutation states for granular loading indicators
		isSignInLoading: signInMutation.isPending,
		isSignUpLoading: signUpMutation.isPending,
		isSignOutLoading: signOutMutation.isPending,

		// Mutation errors for specific error handling
		signInError: signInMutation.error,
		signUpError: signUpMutation.error,
		signOutError: signOutMutation.error,
	};
};
