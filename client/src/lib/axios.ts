import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
		// Include API secret key for authentication
		...(import.meta.env.VITE_API_SECRET_KEY && {
			"X-API-Key": import.meta.env.VITE_API_SECRET_KEY,
		}),
	},
	withCredentials: true, // send cookies with requests
	timeout: 10000,
});

export default api;
