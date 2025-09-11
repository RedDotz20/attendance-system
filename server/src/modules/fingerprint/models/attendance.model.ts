import mongoose, { Document, Schema } from "mongoose";

export interface IFingerprintAttendance extends Document {
	fingerprintId: string;
	name: string;
	department: string;
	timestamp: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

export const fingerprintAttendanceSchema = new Schema<IFingerprintAttendance>(
	{
		fingerprintId: {
			type: String,
			required: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		department: {
			type: String,
			required: true,
			trim: true,
		},
		timestamp: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Index for faster queries
fingerprintAttendanceSchema.index({ fingerprintId: 1 });
fingerprintAttendanceSchema.index({ timestamp: -1 });
fingerprintAttendanceSchema.index({ department: 1 });

export const FingerprintAttendance = mongoose.model<IFingerprintAttendance>(
	"FingerprintAttendance",
	fingerprintAttendanceSchema
);
