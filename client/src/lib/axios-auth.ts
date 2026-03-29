import axios from "axios";

/**
 * Axios instance for auth operations that require API key (like registration)
 * Separate from main axios to include API key for signup endpoint
 */
const apiAuth = axios.create({
	baseURL: import.meta.env.DEV ? "/api" : import.meta.env["VITE_API_URL"] || "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
		// Include API key for registration endpoint
		...(import.meta.env["VITE_API_SECRET_KEY"] && {
			"X-API-Key": import.meta.env["VITE_API_SECRET_KEY"],
		}),
	},
	withCredentials: true, // Send cookies with requests
	timeout: 15000,
});

export default apiAuth;
