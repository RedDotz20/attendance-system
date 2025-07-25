import mongoose, { Document, Schema } from "mongoose";
import type { Role as RoleType } from "@/modules/users/types/user.type.js";

export interface IUser extends Document {
	name?: string;
	email: string;
	password: string;
	role: RoleType;
	createdAt?: Date;
	updatedAt?: Date;
}

export const userSchema = new Schema<IUser>(
	{
		name: { type: String },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: { type: String, enum: ["admin", "user"], default: "user" },
	},
	{ timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
