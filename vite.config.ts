import { defineConfig } from "vitest/config"
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./setup-test.ts",
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'build/',
                'public/',
                'functions/',
                '.firebase/',
                'test-utils/',
                'src/__mocks__/',
                '**/*.d.ts',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                'vite.config.ts',
                'setup-test.ts',
                'src/index.tsx',
                'src/react-app-env.d.ts',
                'src/reportWebVitals.ts',
                'src/serviceWorker.ts',
                'src/FirebaseConfig.ts',
                // Exclude interface files as they are type definitions only
                'src/interfaces/**',
                // Exclude UI components that are primarily Chakra UI wrappers
                'src/components/ui/*',
                // Exclude ColorModeSwitcher as it's a simple wrapper component
                'src/ColorModeSwitcher.tsx',
            ],
            thresholds: {
                global: {
                    statements: 85,
                    branches: 85,
                    functions: 85,
                    lines: 85,
                },
                // Per-file thresholds for critical components
                'src/App.tsx': {
                    statements: 95,
                    branches: 90,
                    functions: 95,
                    lines: 95,
                },
                'src/hooks/useGoogleSignIn.ts': {
                    statements: 95,
                    branches: 90,
                    functions: 95,
                    lines: 95,
                },
                'src/FirebaseConfig.tsx': {
                    statements: 95,
                    branches: 85,
                    functions: 95,
                    lines: 95,
                },
            },
            // Report uncovered lines
            reportOnFailure: true,
            // Include all source files in coverage report
            all: true,
        },
    },
})