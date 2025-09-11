/**
 * User model with strict typing and proper interfaces
 */

import mongoose, { Document, Schema } from "mongoose";
import type { Role, UserDocument } from "@/modules/users/types/user.type.js";
import { UserRoles } from "@/modules/users/types/user.type.js";

// Mongoose document interface
export interface IUserDocument extends Omit<UserDocument, "id">, Document {
	_id: mongoose.Types.ObjectId;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema definition
const userSchema = new Schema<IUserDocument>(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
			trim: true,
			maxLength: [100, "Name cannot exceed 100 characters"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
			match: [
				/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
				"Please provide a valid email",
			],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minLength: [6, "Password must be at least 6 characters"],
			select: false, // Don't include password in queries by default
		},
		role: {
			type: String,
			enum: {
				values: Object.values(UserRoles),
				message: "Role must be either admin or user",
			},
			default: UserRoles.USER,
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: function (doc, ret: any) {
				ret.id = ret._id.toString();
				delete ret._id;
				delete ret.__v;
				delete ret.password; // Never include password in JSON output
				return ret;
			},
		},
	}
);

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for id field
userSchema.virtual("id").get(function (this: IUserDocument) {
	return this._id.toHexString();
});

// Instance method to compare passwords (if needed for bcrypt)
userSchema.methods["comparePassword"] = async function (
	candidatePassword: string
): Promise<boolean> {
	// This would be implemented if you're using bcrypt
	// const bcrypt = await import('bcryptjs');
	// return bcrypt.compare(candidatePassword, this.password);
	return candidatePassword === (this as any).password; // Placeholder - replace with bcrypt
};

// Pre-save middleware for password hashing (if needed)
userSchema.pre("save", async function (this: IUserDocument, next) {
	if (!this.isModified("password")) return next();

	// Hash password here if using bcrypt
	// const bcrypt = await import('bcryptjs');
	// const salt = await bcrypt.genSalt(12);
	// this.password = await bcrypt.hash(this.password, salt);

	next();
});

// Static methods
userSchema.statics["findByEmail"] = function (email: string) {
	return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics["findByRole"] = function (role: Role) {
	return this.find({ role });
};

// Export the model
export const User = mongoose.model<IUserDocument>("User", userSchema);

// Type guard to check if a document is a user document
export function isUserDocument(doc: any): doc is IUserDocument {
	return doc && doc._id && doc.email && doc.role;
}
