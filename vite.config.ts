import { defineConfig } from "vitest/config"
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./setup-test.ts",
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
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
            ],
            thresholds: {
                global: {
                    statements: 90,
                    branches: 85,
                    functions: 90,
                    lines: 90,
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
            },
        },
    },
})