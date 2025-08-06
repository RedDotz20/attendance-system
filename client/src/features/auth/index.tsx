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
import { Eye, EyeClosed } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "./hooks/useAuth";

export default function AuthenticationPage() {
	const { signIn } = useAuth();

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

	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			signIn.mutate({
				email: form.email,
				password: form.password,
			});

			if (form.rememberMe) {
				localStorage.setItem("rememberedEmail", form.email);
			} else {
				localStorage.removeItem("rememberedEmail");
			}
		},
		[form.email, form.password]
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
						onSubmit={handleSubmit}
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
								disabled={signIn.isPending}
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
									disabled={signIn.isPending}
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
									disabled={signIn.isPending}
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
									disabled={signIn.isPending}
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
							disabled={signIn.isPending}
						>
							{signIn.isPending ? "Signing In..." : "Sign in"}
						</Button>
						{signIn.isError && (
							<div
								className="text-red-600 text-sm mt-2"
								aria-live="polite"
								role="alert"
							>
								{signIn.error?.message || "Login failed"}
							</div>
						)}
					</form>
				</CardContent>
				<CardFooter />
			</Card>
		</div>
	);
}
