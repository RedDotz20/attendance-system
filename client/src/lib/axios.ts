import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env["VITE_API_URL"] || "http://localhost:3000",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true, // CRITICAL: Always send cookies for session authentication
	timeout: 15000, // Increased timeout for slower networks
});

// Add response interceptor to log auth issues in development
if (import.meta.env.DEV) {
	api.interceptors.response.use(
		(response) => response,
		(error) => {
			if (error.response?.status === 401 || error.response?.status === 403) {
				console.warn("Auth error detected:", {
					url: error.config?.url,
					status: error.response?.status,
					data: error.response?.data,
					cookies: document.cookie,
				});
			}
			return Promise.reject(error);
		}
	);
}

export default api;
