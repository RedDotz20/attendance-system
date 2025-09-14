import { connectDB } from "./shared/config/database.js";
import { Fingerprint } from "./modules/fingerprint/models/fingerprint.model.js";

async function createTestFingerprint() {
	try {
		await connectDB();

		// Check if test fingerprint already exists
		const existingFingerprint = await Fingerprint.findOne({
			fingerprintId: "1",
		});
		if (existingFingerprint) {
			console.log("✅ Test fingerprint already exists:", existingFingerprint);
			process.exit(0);
		}

		// Create test fingerprint
		const testFingerprint = new Fingerprint({
			fingerprintId: "1",
			name: "John Doe",
			department: "IT",
			isActive: true,
		});

		await testFingerprint.save();
		console.log("✅ Test fingerprint created successfully:", testFingerprint);
	} catch (error) {
		console.error("❌ Error creating test fingerprint:", error);
	}

	process.exit(0);
}

createTestFingerprint();
