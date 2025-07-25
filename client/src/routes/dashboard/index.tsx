import { requireAuth } from "@/features/auth/utils/protectRoute";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { Route as rootRoute } from "@/routes/__root";
import { authQuery } from "@/features/auth/api/authQuery";


export const Route = createFileRoute("/dashboard/")({
	beforeLoad: requireAuth,
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

	const handleSignOut = () => {
		logoutMutation.mutate();
		console.log("signout button triggered");
	};

	console.log("AUTHDASHBOARD", auth);

	return (
		<div>
			<h1>Hello "/dashboard/"!</h1>
			{JSON.stringify(auth)}
			<Button onClick={handleSignOut}>logout</Button>
		</div>
	);
}

// import { useRouteContext } from "@tanstack/react-router";
