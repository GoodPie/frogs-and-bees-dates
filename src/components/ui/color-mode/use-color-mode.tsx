import {useTheme} from "next-themes";
import type {ColorMode, UseColorModeReturn} from "./color-mode.tsx";

export function useColorMode(): UseColorModeReturn {
    const {resolvedTheme, setTheme, forcedTheme} = useTheme()
    const colorMode = forcedTheme || resolvedTheme
    const toggleColorMode = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    return {
        colorMode: colorMode as ColorMode,
        setColorMode: setTheme,
        toggleColorMode,
    }
}