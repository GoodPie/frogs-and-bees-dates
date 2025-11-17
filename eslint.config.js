import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))
const aliasSource = JSON.parse(
    fs.readFileSync(new URL('./config/alias-map.json', import.meta.url), 'utf-8'),
)
const resolveFromRoot = (...segments) => path.resolve(tsconfigRootDir, ...segments)
const aliasMap = Object.fromEntries(
    Object.entries(aliasSource).map(([symbol, target]) => [symbol, resolveFromRoot(target)]),
)

export default tseslint.config(
    {
        ignores: [
            'node_modules/**',
            'dist',
            'build',
            'coverage',
            '**/*.min.js',
            'public/**',
            'specs/**',
            'config/**/*.js',
            'scripts/**/*.js',
            'eslint.config.js',
            '**/__tests__/**',
            '**/__mocks__/**',
            'functions/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        settings: {
            'shared/aliasMap': aliasMap,
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
        },
    },
    {
        files: [
            'tests/**/*.{ts,tsx,js}',
            'setup-test.ts',
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            'src/**/*.spec.ts',
            'src/**/*.spec.tsx',
        ],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.vitest,
            },
        },
    },
    {
        files: [
            'scripts/**/*.{ts,js}',
            'config/**/*.{ts,js}',
            'vite.config.ts',
            'vitest.config.ts',
        ],
        languageOptions: {
            globals: globals.node,
        },
    },
)
