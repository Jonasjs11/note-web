import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        react(),
    ],

    base: "/note-web/",

    resolve: {
        dedupe: [
            "react",
            "react-dom",
        ],
    },

    build: {
        sourcemap: true,
        minify: false,
    },
});