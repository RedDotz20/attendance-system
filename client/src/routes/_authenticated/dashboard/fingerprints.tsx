import FingerprintsPage from "@/features/fingerprint/pages/fingerprints-table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/fingerprints")({
	component: FingerprintsPage,
});
