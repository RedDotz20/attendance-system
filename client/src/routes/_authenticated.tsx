import { requireAuth } from "@/features/auth/utils/protectRoute";
import { createFileRoute } from "@tanstack/react-router";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: requireAuth,
	component: AuthenticatedLayout,
});
