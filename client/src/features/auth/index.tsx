import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function AuthPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const signInMutation = useMutation({
		mutationFn: async ({
			email,
			password,
		}: {
			email: string;
			password: string;
		}) => {
			const res = await fetch("http://localhost:3000/auth/signin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});
			if (!res.ok) throw new Error("Invalid credentials");
			return res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
			toast.success("Login Success");
			console.log("Login Success NAVIGATING TO DASHBOARD");
			navigate({ to: "/dashboard" });
		},
		onError: async (err) => {
			console.error(err.message);
			toast.error(err.message, {
				style: { border: "2px solid red" },
			});
		},
	});

	const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;
		console.log({ email, password });
		signInMutation.mutate({ email, password });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-sm">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Sign in
					</CardTitle>
					<CardDescription className="text-center">
						Enter your email and password to access your account
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form
						className="space-y-4"
						onSubmit={handleSignIn}
					>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								name="email"
								placeholder="m@example.com"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								name="password"
								required
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<input
									id="remember"
									type="checkbox"
									className="h-4 w-4 rounded border-gray-300"
								/>
								<Label
									htmlFor="remember"
									className="text-sm font-normal"
								>
									Remember me
								</Label>
							</div>
							<a
								href="/forgot-password"
								className="text-sm text-primary hover:underline"
							>
								Forgot password?
							</a>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={signInMutation.isPending}
						>
							{signInMutation.isPending ? "Signing In..." : "Sign in"}
						</Button>
					</form>
				</CardContent>
				<CardFooter>
					{/* <p className="text-center text-sm text-muted-foreground w-full">
						Don't have an account?{" "}
						<a
							href="/sign-up"
							className="text-primary hover:underline"
						>
							Sign up
						</a>
					</p> */}
				</CardFooter>
			</Card>
		</div>
	);
}
