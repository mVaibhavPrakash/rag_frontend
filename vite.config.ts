/// <reference types="vite/client" />

import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    server: {
        host: "localhost",
        port: 8765,
        proxy: {
            // Forward every /api/* request to the FastAPI backend.
            "/api": {
                target: BACKEND_URL,
                changeOrigin: true,
                // No rewrite - the backend registers routes as /api/documents and /api/chat
            },
        },
    },
    build: {
        sourcemap: false,
        emptyOutDir: true,
        chunkSizeWarningLimit: 10000,
    },
    worker: {
        format: "es",
    },
    // env vars must be prefixed with VITE_ and live in the repo root .env file
});
