import { createFileRoute } from "@tanstack/react-router";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { AuthService } from "@/features/auth/services/auth.service";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: AuthService.protectRoute,
	component: AuthenticatedLayout,
});
