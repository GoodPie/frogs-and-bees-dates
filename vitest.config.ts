import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

import { fileURLToPath } from 'node:url'
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    test: {
        environment: 'jsdom',
        setupFiles: './setup-test.ts',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'setup-test.ts',
                '**/*.d.ts',
                '**/*.config.*',
                '**/dist/**',
                '**/__mocks__/**',
            ],
            thresholds: {
                statements: 85,
                branches: 85,
                functions: 85,
                lines: 85,
            },
        },
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
            },
        },
    },
})
