import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { authQuery } from "@/features/auth/api/authQuery";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { data: auth } = useQuery(authQuery);
	const navigate = useNavigate();
	const redirectLogin = () => {
		if (!auth?.authenticated) {
			return navigate({ to: "/auth" });
		} else {
			return navigate({ to: "/dashboard" });
		}
	};

	return (
		<div className="text-center">
			<header className="min-h-dvh flex flex-col items-center justify-center bg-[#282c34]  text-[calc(10px+2vmin)]">
				Home Page
				<Button
					variant="secondary"
					onClick={redirectLogin}
				>
					{!auth?.authenticated ? "Login" : "Go To Dashboard"}
				</Button>
			</header>
		</div>
	);
}
