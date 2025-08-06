import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const redirectLogin = useCallback(() => {
		navigate({ to: isAuthenticated ? "/dashboard" : "/auth" });
	}, [isAuthenticated, navigate]);

	return (
		<div className="text-center">
			<header className="min-h-dvh flex flex-col items-center justify-center text-[calc(10px+2vmin)]">
				<h1 className="mb-4 font-bold text-2xl">Attendance System</h1>
				<Button
					variant="secondary"
					onClick={redirectLogin}
				>
					{isAuthenticated ? "Go To Dashboard" : "Login"}
				</Button>
			</header>
		</div>
	);
}
