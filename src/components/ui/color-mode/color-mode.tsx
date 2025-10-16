"use client"

import type {ThemeProviderProps} from "next-themes"
import {ThemeProvider} from "next-themes"

export type ColorModeProviderProps = ThemeProviderProps

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange {...props} />
  )
}

export type ColorMode = "light" | "dark"

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

