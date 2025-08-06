import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
		// Add other default headers here if needed
	},
	withCredentials: true, // if you want to send cookies with requests
});

export default api;
