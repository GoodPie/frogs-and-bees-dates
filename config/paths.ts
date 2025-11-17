import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aliasSource = JSON.parse(
    fs.readFileSync(new URL('./alias-map.json', import.meta.url), 'utf-8'),
) as Record<string, string>

type AliasSymbol = keyof typeof aliasSource

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

const resolveFromRoot = (...segments: string[]) => path.resolve(projectRoot, ...segments)

const absoluteAliasMap = Object.fromEntries(
    Object.entries(aliasSource).map(([symbol, target]) => [symbol, resolveFromRoot(target)]),
) as Record<AliasSymbol, string>

export const aliasMap = absoluteAliasMap

export const tsconfigPaths = Object.fromEntries(
    Object.entries(aliasMap).map(([symbol, target]) => [`${symbol}/*`, [`${target}/*`]]),
) as Record<`${AliasSymbol}/*`, string[]>

export const viteAliases = Object.entries(aliasMap).map(([find, replacement]) => ({
    find,
    replacement,
}))

export const resolveAlias = (alias: AliasSymbol) => aliasMap[alias]

export const rootDir = projectRoot
