// API response structure
export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	errors?: { field: string; message: string }[];
}

// Example for a context object extension in Hono (if you need to attach custom properties)
// declare module 'hono' {
//   interface ContextVariableMap {
//     userId: string; // Example: if you set userId in an auth middleware
//   }
// }
