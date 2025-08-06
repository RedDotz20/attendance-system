import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
// import { useQuery } from "@tanstack/react-query";
// import { authQuery } from "@/features/auth/api/mutations";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const redirectLogin = () => {
		if (!isAuthenticated) {
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
					{!isAuthenticated ? "Login" : "Go To Dashboard"}
				</Button>
			</header>
		</div>
	);
}
