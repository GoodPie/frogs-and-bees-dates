import path from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

import { rootDir, viteAliases } from './config/paths'

const testInclude = [
    'tests/**/*.{test,spec}.{ts,tsx}',
    'src/**/*.{test,spec}.{ts,tsx}',
]

const testExclude = ['**/node_modules/**', '**/dist/**', '**/build/**']

const setupFiles = [path.join(rootDir, 'setup-test.ts')]

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: viteAliases,
    },
    test: {
        environment: 'jsdom',
        setupFiles,
        include: testInclude,
        exclude: testExclude,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
            reportsDirectory: 'coverage',
            include: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
            exclude: [
                'node_modules/**',
                'coverage/**',
                'dist/**',
                'build/**',
                'setup-test.ts',
                '**/*.d.ts',
                '**/*.config.*',
                '**/__mocks__/**',
                'config/**',
                'functions/**',
                'public/**',
                'specs/**',
                'docs/**',
                'scripts/**',
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
