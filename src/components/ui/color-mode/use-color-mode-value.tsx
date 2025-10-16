import {useColorMode} from "./use-color-mode.tsx";

export function useColorModeValue<T>(light: T, dark: T) {
    const {colorMode} = useColorMode()
    return colorMode === "dark" ? dark : light
}