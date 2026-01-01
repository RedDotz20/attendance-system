/**
 * Fingerprint feature exports
 */

// Pages
import FingerprintsPage from "./pages/fingerprints-table";
export { default as FingerprintsPage } from "./pages/fingerprints-table";

// Services
export { FingerprintService } from "./services/fingerprint.service";

// Hooks
export {
	useFingerprints,
	useCheckFingerprint,
	useFingerprintAttendanceHistory,
	useRegisterFingerprint,
	useMarkFingerprintAttendance,
	useFingerprintAttendanceStats,
	usePrefetchFingerprint,
	fingerprintQueryKeys,
} from "./hooks/useFingerprint";

// Schemas
export {
	fingerprintRegistrationSchema,
	fingerprintAttendanceSchema,
	fingerprintSearchSchema,
	fingerprintAttendanceFiltersSchema,
	type FingerprintRegistrationFormData,
	type FingerprintAttendanceFormData,
	type FingerprintSearchFormData,
	type FingerprintAttendanceFiltersFormData,
} from "./schema/fingerprint.schema";

// Types
export type {
	Fingerprint,
	FingerprintRegistration,
	FingerprintAttendance,
	FingerprintAttendanceRequest,
	FingerprintCheckResponse,
	FingerprintListFilters,
	FingerprintAttendanceFilters,
} from "@/types/fingerprint.type";

// Default export
export default FingerprintsPage;
