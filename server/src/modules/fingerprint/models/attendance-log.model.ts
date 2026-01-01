import mongoose, { Document, Schema } from "mongoose";

export interface IAttendanceLog extends Document {
	fingerprintId: string;
	name: string;
	department: string;
	timestamp: Date;
	eventType: "attendance" | "registration" | "device_status"; // Type of event
	deviceId?: string; // Device that captured the event
	metadata?: Record<string, any>; // Additional event data
	createdAt?: Date;
	updatedAt?: Date;
}

export const attendanceLogSchema = new Schema<IAttendanceLog>(
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
		eventType: {
			type: String,
			enum: ["attendance", "registration", "device_status"],
			default: "attendance",
		},
		deviceId: {
			type: String,
			trim: true,
		},
		metadata: {
			type: Schema.Types.Mixed,
		},
	},
	{ timestamps: true }
);

// Indexes for efficient queries
attendanceLogSchema.index({ fingerprintId: 1 });
attendanceLogSchema.index({ timestamp: -1 });
attendanceLogSchema.index({ department: 1 });
attendanceLogSchema.index({ eventType: 1 });
attendanceLogSchema.index({ createdAt: -1 }); // For pagination and log cleanup

export const AttendanceLog = mongoose.model<IAttendanceLog>(
	"AttendanceLog",
	attendanceLogSchema
);
