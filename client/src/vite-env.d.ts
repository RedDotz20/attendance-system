/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_API_SECRET_KEY?: string;
	readonly MODE: string;
	readonly BASE_URL: string;
	readonly PROD: boolean;
	readonly DEV: boolean;
	readonly SSR: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
