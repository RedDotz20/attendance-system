import { useState, useEffect, useCallback } from "react";
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
import { Eye, EyeClosed } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function AuthPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [form, setForm] = useState({
		email: "",
		password: "",
		rememberMe: false,
		showPassword: false,
	});

	// On mount, check localStorage for remembered email
	useEffect(() => {
		const rememberedEmail = localStorage.getItem("rememberedEmail");
		if (rememberedEmail) {
			setForm((prev) => ({
				...prev,
				email: rememberedEmail,
				rememberMe: true,
			}));
		}
	}, []);

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
			if (form.rememberMe) {
				localStorage.setItem("rememberedEmail", form.email);
			} else {
				localStorage.removeItem("rememberedEmail");
			}
			navigate({ to: "/dashboard" });
		},
		onError: (err: any) => {
			console.error(err.message);
			toast.error(err.message, {
				style: { border: "2px solid red" },
			});
		},
	});

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type, checked } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	}, []);

	const handleRememberMe = useCallback((checked: boolean) => {
		setForm((prev) => ({
			...prev,
			rememberMe: checked,
		}));
	}, []);

	const handleShowPassword = useCallback(() => {
		setForm((prev) => ({
			...prev,
			showPassword: !prev.showPassword,
		}));
	}, []);

	const handleSignIn = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			signInMutation.mutate({
				email: form.email,
				password: form.password,
			});
		},
		[form.email, form.password, signInMutation]
	);

	return (
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
						autoComplete="on"
					>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								name="email"
								placeholder="m@example.com"
								required
								value={form.email}
								onChange={handleChange}
								disabled={signInMutation.isPending}
								autoFocus
								autoComplete="email"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Input
									id="password"
									type={form.showPassword ? "text" : "password"}
									name="password"
									required
									value={form.password}
									className="pr-16"
									onChange={handleChange}
									disabled={signInMutation.isPending}
									autoComplete="current-password" // Added for autofill
								/>
								<Button
									variant="ghost"
									size="icon"
									type="button"
									onClick={handleShowPassword}
									className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none"
									aria-label={
										form.showPassword ? "Hide password" : "Show password"
									}
									disabled={signInMutation.isPending}
								>
									{form.showPassword ? <EyeClosed /> : <Eye />}
								</Button>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="remember"
									checked={form.rememberMe}
									onCheckedChange={handleRememberMe}
									disabled={signInMutation.isPending}
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
						{signInMutation.isError && (
							<div
								className="text-red-600 text-sm mt-2"
								aria-live="polite"
								role="alert"
							>
								{signInMutation.error?.message || "Login failed"}
							</div>
						)}
					</form>
				</CardContent>
				<CardFooter />
			</Card>
		</div>
	);
}
