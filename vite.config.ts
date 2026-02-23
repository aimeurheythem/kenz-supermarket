import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: './',
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@db': path.resolve(__dirname, 'database'),
        },
    },
    optimizeDeps: {
        include: ['sql.js'],
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['lucide-react', 'framer-motion', 'recharts'],
                    'vendor-db': ['sql.js', 'better-sqlite3'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        minify: 'esbuild',
    },
    server: {
        port: 5173,
        strictPort: true,
    },
});
