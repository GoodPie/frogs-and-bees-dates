# Tooling Alignment Guide

## Linting Policy

- **Config**: `eslint.config.js` (flat) extending `@eslint/js` + `typescript-eslint` recommended sets with React Hooks + React Refresh rules enabled globally.
- **Parser Project**: `tsconfig.eslint.json` unifies `src/`, `tests/`, `config/`, and `scripts/` so alias-aware linting runs everywhere without duplicate overrides.
- **Environment Overrides**:
  - _Browser_: default block for all `src/**` files with DOM globals.
  - _Tests_: `tests/**`, `setup-test.ts`, and colocated `*.test|*.spec` files opt into Vitest globals plus DOM.
  - _Node tooling_: `scripts/**`, `config/**`, `vite.config.ts`, `vitest.config.ts` switch to Node globals.
- **Canonical Commands**:
  - `npm run lint` for local iteration (warnings allowed for Fast Refresh notices).
  - `npm run lint:ci` fails on warnings/errors for CI gates.
- **Alias Source**: `config/alias-map.json` feeds ESLint, Vite, Vitest, and automation through `config/paths.ts`.

## Project Build Profile

- **Configs**:
  - `tsconfig.base.json` holds shared compiler flags (ES2022 target, JSX runtime, strict mode, alias paths, `resolveJsonModule`).
  - `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.test.json` are composite projects that extend the base file with scoped `include`/`exclude` blocks and build info caches under `node_modules/.tmp`.
  - Root `tsconfig.json` references the three entry configs so `tsc -b` (and `npm run typecheck`) builds the entire workspace deterministically.
- **Runtime Alignment**:
  - `vite.config.ts` imports `viteAliases` from `config/paths.ts`, ensuring bundler resolution mirrors the compiler.
  - `scripts/verify-tooling.ts` `build` mode runs `npm run build` (which executes `npm run typecheck && vite build`) and emits alias metadata to `/tooling/build-profile/sync`.
- **Developer Commands**:
  - `npm run typecheck` executes `tsc -b --pretty false` with project references.
  - `npm run build` leverages `typecheck` before the Vite bundle to catch drift early.

## TestSuiteDirectoryMap

- **Configs**:
  - `tsconfig.test.json` extends the base compiler profile and explicitly includes `tests/**/*`, `src/**/*.test.ts(x)`, and `src/**/*.spec.ts(x)` plus Firebase mocks.
  - `vitest.config.ts` imports `viteAliases` from `config/paths.ts`, pins `test.environment` to `jsdom`, and enforces coverage thresholds (`≥85%`) shared with the coverage validator.
  - `setup-test.ts` prepares Resize/Intersection observers, Firebase mocks, router shims, and exposes `__TEST_SUITE_DIRECTORIES` + `__TEST_SETUP_FILES` on `globalThis` so suites can introspect the registered directories.
- **Discovery Map**:
  - `tests/unit` – isolated logic and hooks with DOM-friendly globals.
  - `tests/integration` – high-level flows that expect Firebase mocks and router helpers.
  - `src/**/*.{test,spec}.{ts,tsx}` – colocated specs that need the same Vitest + alias pipeline.
- **Setup Guarantees**:
  - Firebase SDK calls route through `global.__firebaseMocks` with automatic resets in `beforeEach`.
  - DOM polyfills (ResizeObserver, IntersectionObserver, `matchMedia`, `localStorage`) provide parity with the browser runtime used by Chakra UI.
- **Commands**:
  - `npm run test` executes Vitest in single-run mode for iterative debugging.
  - `npm run test:coverage` (and `npm run validate:coverage`) run coverage with JSON reporter output to `coverage/vitest-report.json`, enabling `scripts/verify-tooling.ts` to report discovered suites to `/tooling/test-harness/check`.

## Automation

- `scripts/verify-tooling.ts` provides `npm run verify:tooling <lint|build|test>` to shell out to the canonical commands and emit the OpenAPI payload for CI contracts; the `test` mode parses `coverage/vitest-report.json` to capture discovered suite counts and confirm `setup-test.ts` executed successfully.
- `npm run validate:tooling` chains `lint`, `build`, and `test:coverage` for local smoke testing before pushing changes.
- `.github/workflows/tooling.yml` runs on push/PR with Node 20, executes `npm ci`, runs the quality gate, captures each `verify:tooling` invocation via `tee`, and uploads the logs as an artifact so reviewers can audit payloads when contracts report drift.
