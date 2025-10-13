import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterFingerprint } from "@/features/fingerprint";
import {
	fingerprintRegistrationSchema,
	type FingerprintRegistrationFormData,
} from "@/features/fingerprint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

interface FingerprintRegistrationFormProps {
	onSuccess?: () => void;
	isLoading?: boolean;
}

export function FingerprintRegistrationForm({
	onSuccess,
	isLoading = false,
}: FingerprintRegistrationFormProps) {
	const registerMutation = useRegisterFingerprint();

	const form = useForm<FingerprintRegistrationFormData>({
		resolver: zodResolver(fingerprintRegistrationSchema),
		defaultValues: {
			fingerprintId: "",
			name: "",
			department: "",
		},
	});

	const onSubmit = async (data: FingerprintRegistrationFormData) => {
		try {
			await registerMutation.mutateAsync(data);
			form.reset();
			onSuccess?.();
		} catch (error) {
			// Error is handled by the mutation hook
			console.error("Registration failed:", error);
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="fingerprintId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Fingerprint ID</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter fingerprint ID (e.g., 1, 2, 3...)"
									{...field}
									disabled={isLoading || registerMutation.isPending}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Full Name</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter full name"
									{...field}
									disabled={isLoading || registerMutation.isPending}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="department"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Department</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter department"
									{...field}
									disabled={isLoading || registerMutation.isPending}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => form.reset()}
						disabled={isLoading || registerMutation.isPending}
					>
						Reset
					</Button>
					<Button
						type="submit"
						disabled={isLoading || registerMutation.isPending}
					>
						{isLoading || registerMutation.isPending
							? "Registering..."
							: "Register Fingerprint"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
