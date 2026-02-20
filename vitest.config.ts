/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@db': path.resolve(__dirname, 'database'),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify('1.0.0-test'),
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}', 'database/**/*.{test,spec}.ts'],
        exclude: ['node_modules', 'dist', 'electron'],
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            include: ['src/**/*.{ts,tsx}', 'database/**/*.ts'],
            exclude: [
                'src/__tests__/**',
                'src/types/**',
                'src/main.tsx',
                'src/components/ui/**',
                'database/schema.ts',
                'database/seed.ts',
            ],
        },
    },
});
