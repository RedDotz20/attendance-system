import { useState, useEffect, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
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
import { signInSchema, type SignInFormData } from "./schema/auth.schema";

export default function AuthenticationPage() {
	const { signIn, isSignInLoading, signInError } = useAuth();
	const [showPassword, setShowPassword] = useState(false);

	const authForm = useForm({
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		} as SignInFormData,
		validators: { onChange: signInSchema },
		onSubmit: async ({ value }: { value: SignInFormData }) => {
			try {
				await signIn({
					email: value.email,
					password: value.password,
				});

				// Handle remember me functionality
				if (value.rememberMe) {
					localStorage.setItem("rememberedEmail", value.email);
				} else {
					localStorage.removeItem("rememberedEmail");
				}
			} catch (error) {
				// Error is handled by the useAuth hook
				console.error("Login failed:", error);
			}
		},
	});

	useEffect(() => {
		const rememberedEmail = localStorage.getItem("rememberedEmail");
		if (rememberedEmail) {
			authForm.setFieldValue("email", rememberedEmail);
			authForm.setFieldValue("rememberMe", true);
		}
	}, [authForm]);

	const handleShowPassword = useCallback(
		() => setShowPassword((prev) => !prev),
		[]
	);

	const renderError = (errors: any) => {
		return (
			<div className="text-destructive text-sm h-3">
				{typeof errors[0] === "string" ? errors[0] : errors[0]?.message ?? ""}
			</div>
		);
	};

	// errors && (
	// 	<div className="text-destructive text-sm">
	// 		{typeof errors[0] === "string" ? errors[0] : errors[0]?.message ?? ""}
	// 	</div>
	// );

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
						onSubmit={(e) => {
							e.preventDefault();
							authForm.handleSubmit();
						}}
						autoComplete="on"
					>
						<authForm.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										type="email"
										name={field.name}
										placeholder="m@example.com"
										required
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										disabled={isSignInLoading}
										autoFocus
										autoComplete="email"
									/>
									{renderError(field.state.meta.errors)}
								</div>
							)}
						</authForm.Field>

						<authForm.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password</Label>
									<div className="relative">
										<Input
											id={field.name}
											type={showPassword ? "text" : "password"}
											name={field.name}
											required
											value={field.state.value}
											className="pr-16"
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											disabled={isSignInLoading}
											autoComplete="current-password"
										/>
										<Button
											variant="ghost"
											size="icon"
											type="button"
											onClick={handleShowPassword}
											className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none"
											aria-label={
												showPassword ? "Hide password" : "Show password"
											}
											disabled={isSignInLoading}
										>
											{showPassword ? <EyeClosed /> : <Eye />}
										</Button>
									</div>
									{renderError(field.state.meta.errors)}
								</div>
							)}
						</authForm.Field>

						<authForm.Field name="rememberMe">
							{(field) => (
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Checkbox
											id={field.name}
											checked={field.state.value}
											onCheckedChange={(checked) =>
												field.handleChange(checked as boolean)
											}
											disabled={isSignInLoading}
										/>
										<Label
											htmlFor={field.name}
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
							)}
						</authForm.Field>

						<authForm.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									className="w-full"
									disabled={!canSubmit || isSubmitting || isSignInLoading}
								>
									{isSignInLoading ? "Signing In..." : "Sign in"}
								</Button>
							)}
						</authForm.Subscribe>

						{signInError && (
							<div
								className="text-red-600 text-sm mt-2"
								aria-live="polite"
								role="alert"
							>
								{signInError?.message || "Login failed"}
							</div>
						)}
					</form>
				</CardContent>
				<CardFooter />
			</Card>
		</div>
	);
}
