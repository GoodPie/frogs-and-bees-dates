#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

import aliasSource from '../config/alias-map.json' assert { type: 'json' }

type VerificationCommand = 'lint' | 'build' | 'test'

interface BasePayload {
    commitSha: string
}

interface LintPayload extends BasePayload {
    configVersion: string
    paths: string[]
}

interface BuildPayload extends BasePayload {
    tsconfigBase: string
    viteConfig: string
    aliases: { symbol: string; target: string }[]
}

interface TestPayload extends BasePayload {
    directories: string[]
    setupFiles: string[]
    environment: 'jsdom' | 'happy-dom' | 'node'
    discoveredSuites?: number
    totalTests?: number
    setupExecuted?: boolean
}

interface TestRunSummary {
    discoveredSuites: number
    totalTests: number
    setupExecuted: boolean
}

const CONTRACT_ENDPOINTS = {
    lint: '/tooling/lint-config/validate',
    build: '/tooling/build-profile/sync',
    test: '/tooling/test-harness/check',
} as const

const npmArgs: Record<VerificationCommand, string[]> = {
    lint: ['run', 'lint'],
    build: ['run', 'build'],
    test: ['run', 'test:coverage'],
}

const projectRoot = path.resolve(process.cwd())
const vitestReportPath = path.resolve(projectRoot, 'coverage', 'vitest-report.json')

const resolveRepoPath = (...segments: string[]) => path.resolve(projectRoot, ...segments)

const getCurrentSha = () =>
    process.env.GIT_COMMIT ??
    spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout.trim()

const buildLintPayload = (): LintPayload => ({
    commitSha: getCurrentSha(),
    configVersion: process.env.LINT_CONFIG_VERSION ?? '0.0.0',
    paths: ['src', 'tests'],
})

const resolvedAliasMap = Object.fromEntries(
    Object.entries(aliasSource).map(([symbol, target]) => [
        symbol.endsWith('/') ? symbol : `${symbol}/`,
        resolveRepoPath(target),
    ]),
)

const buildBuildPayload = (): BuildPayload => ({
    commitSha: getCurrentSha(),
    tsconfigBase: resolveRepoPath('tsconfig.base.json'),
    viteConfig: resolveRepoPath('vite.config.ts'),
    aliases: Object.entries(resolvedAliasMap).map(([symbol, target]) => ({ symbol, target })),
})

const TEST_DIRECTORIES = ['tests/unit', 'tests/integration', 'src']
const TEST_SETUP_FILES = ['setup-test.ts']

const sleep = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const ensureVitestReport = () => {
    const maxAttempts = 5
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (fs.existsSync(vitestReportPath)) {
            return
        }
        sleep(200)
    }
    throw new Error(
        `[verify-tooling] Missing Vitest report at ${vitestReportPath}. Ensure npm run test:coverage finished successfully.`,
    )
}

const buildTestPayload = (summary?: TestRunSummary): TestPayload => ({
    commitSha: getCurrentSha(),
    directories: TEST_DIRECTORIES,
    setupFiles: TEST_SETUP_FILES.map((file) => resolveRepoPath(file)),
    environment: 'jsdom',
    discoveredSuites: summary?.discoveredSuites,
    totalTests: summary?.totalTests,
    setupExecuted: summary?.setupExecuted,
})

const runNpmTask = (command: VerificationCommand) => {
    const child = spawnSync('npm', npmArgs[command], { stdio: 'inherit' })
    if (child.status !== 0) {
        throw new Error(`npm ${npmArgs[command].join(' ')} failed with status ${child.status}`)
    }
}

const parseVitestReport = (): TestRunSummary => {
    ensureVitestReport()
    try {
        const report = JSON.parse(fs.readFileSync(vitestReportPath, 'utf-8'))
        const discoveredSuites =
            report.numTotalTestSuites ?? report.testResults?.length ?? 0
        const totalTests =
            report.numTotalTests ??
            report.testResults?.reduce(
                (sum: number, result: { assertionResults?: unknown[] }) =>
                    sum + (result.assertionResults?.length ?? 0),
                0,
            ) ??
            0
        const setupExecuted =
            report.success !== false &&
            TEST_SETUP_FILES.every((file) => fs.existsSync(resolveRepoPath(file)))
        return { discoveredSuites, totalTests, setupExecuted }
    } catch (error) {
        throw new Error(
            `[verify-tooling] Failed to parse Vitest report at ${vitestReportPath}: ${(error as Error).message}`,
        )
    }
}

const postPlaceholder = (command: VerificationCommand, summary?: TestRunSummary) => {
    const payload =
        command === 'lint'
            ? buildLintPayload()
            : command === 'build'
              ? buildBuildPayload()
              : buildTestPayload(summary)
    console.log(
        `[verify-tooling] Would POST to ${CONTRACT_ENDPOINTS[command]} with payload:`,
        JSON.stringify(payload, null, 2),
    )
}

const usage = () => {
    console.log('Usage: npm run verify:tooling <lint|build|test>')
}

const main = () => {
    const [, , rawCommand] = process.argv
    if (!rawCommand || !['lint', 'build', 'test'].includes(rawCommand)) {
        usage()
        process.exit(1)
    }
    const command = rawCommand as VerificationCommand
    runNpmTask(command)
    const summary = command === 'test' ? parseVitestReport() : undefined
    postPlaceholder(command, summary)
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
}
