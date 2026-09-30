/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	base: process.env.BASE_URL,
	plugins: [react()],
	server: {
		host: "localhost",
		port: 8765
	},
	build: {
		sourcemap: false,
		emptyOutDir: true,
		chunkSizeWarningLimit: 10000
	},
	worker: {
		format: "es"
	},
	envDir: "env",
	envPrefix: "APP" // Replace the default prefix "VITE" with "APP" for the environment variables.
});
