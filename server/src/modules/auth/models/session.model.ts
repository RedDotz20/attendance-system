import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
	userId: mongoose.Types.ObjectId;
	sessionId: string;
	createdAt: Date;
	expiresAt: Date;
}

const sessionSchema = new Schema<ISession>({
	userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
	sessionId: { type: String, required: true, unique: true },
	createdAt: { type: Date, default: Date.now },
	expiresAt: { type: Date, required: true, index: true }, // index for cleanup
});

export const Session = mongoose.model<ISession>("Session", sessionSchema);
