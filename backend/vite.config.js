import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";

export default defineConfig({
    server: {
        host: "localhost",
        port: 8080, // port FE kamu
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8000", // PORT BACKEND LARAVEL
                changeOrigin: true,
                secure: false,
            }
        }
    },

    plugins: [
        laravel({
            input: [
                "resources/sass/app.scss",
                "resources/js/app.js",
            ],
            refresh: true,
        }),
    ],
});
