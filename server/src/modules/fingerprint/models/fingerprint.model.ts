import mongoose, { Document, Schema } from "mongoose";

export interface IFingerprint extends Document {
	fingerprintId: string;
	name: string;
	department: string;
	isActive: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export const fingerprintSchema = new Schema<IFingerprint>(
	{
		fingerprintId: {
			type: String,
			required: true,
			unique: true,
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
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

// Index for faster queries
fingerprintSchema.index({ department: 1 });
fingerprintSchema.index({ fingerprintId: 1 });

export const Fingerprint = mongoose.model<IFingerprint>(
	"Fingerprint",
	fingerprintSchema
);
