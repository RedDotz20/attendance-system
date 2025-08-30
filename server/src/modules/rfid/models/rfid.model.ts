import mongoose, { Document, Schema } from "mongoose";

export interface IRfidCard extends Document {
	uid: string;
	name: string;
	department: string;
	isActive: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

export const rfidCardSchema = new Schema<IRfidCard>(
	{
		uid: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
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
rfidCardSchema.index({ department: 1 });

export const RfidCard = mongoose.model<IRfidCard>("RfidCard", rfidCardSchema);
