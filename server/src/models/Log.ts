import * as mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
	userId: String,
	username: String,
	role: String,
	method: String,
	path: String,
	timestamp: { type: Date, default: Date.now },
});

export const Log = mongoose.models?.Log || mongoose.model("Log", LogSchema);
