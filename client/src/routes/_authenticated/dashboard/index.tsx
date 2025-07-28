import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authQuery } from "@/features/auth/api/authQuery";

export const Route = createFileRoute("/_authenticated/dashboard/")({
	component: DashboardComponent,
});

function DashboardComponent() {
	const { data: auth } = useQuery(authQuery);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const logoutMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("http://localhost:3000/auth/logout", {
				method: "POST",
				credentials: "include",
			});

			if (!res.ok) throw new Error("Logout failed");

			console.log("LOGOUT SUCCESS");

			return res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
			navigate({ to: "/auth" });
		},
	});

	const handleSignOut = () => logoutMutation.mutate();

	return (
		<div>
			<h1>Hello Dashboard!</h1>
			<p className="mb-4">Welcome to your protected dashboard.</p>
			{auth && (
				<div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
					<h2 className="font-semibold mb-2">User Info:</h2>
					<pre className="text-sm">{JSON.stringify(auth, null, 2)}</pre>
				</div>
			)}
			<Button
				onClick={handleSignOut}
				variant="destructive"
			>
				Logout
			</Button>
		</div>
	);
}

// import { useRouteContext } from "@tanstack/react-router";
