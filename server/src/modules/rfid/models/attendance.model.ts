import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
	uid: string;
	name: string;
	department: string;
	timestamp: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

export const attendanceSchema = new Schema<IAttendance>(
	{
		uid: {
			type: String,
			required: true,
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
		timestamp: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Index for faster queries
attendanceSchema.index({ uid: 1 });
attendanceSchema.index({ timestamp: -1 });
attendanceSchema.index({ department: 1 });

export const Attendance = mongoose.model<IAttendance>(
	"Attendance",
	attendanceSchema
);
