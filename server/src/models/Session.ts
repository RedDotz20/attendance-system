import * as mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
	sid: { type: String, unique: true },
	data: { type: Object, default: {} },
	createdAt: { type: Date, default: Date.now },
	expiresAt: { type: Date },
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session =
	mongoose.models?.Session || mongoose.model("Session", SessionSchema);
