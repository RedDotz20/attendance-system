import axios from "axios";

/**
 * Axios instance specifically for fingerprint/device control endpoints that require API key
 * This is separate from the main axios instance which is used for auth endpoints
 */
const apiFP = axios.create({
	baseURL: import.meta.env["VITE_API_URL"] || "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
		// Include API secret key for fingerprint endpoints
		...(import.meta.env["VITE_API_SECRET_KEY"] && {
			"X-API-Key": import.meta.env["VITE_API_SECRET_KEY"],
		}),
	},
	withCredentials: true, // send cookies with requests
	timeout: 10000,
});

export default apiFP;
