import {
    IconButton,
    type IconButtonProps,
} from "@chakra-ui/react"
import {FaMoon, FaSun} from "react-icons/fa"
import {useColorModeValue} from "./components/ui/color-mode/use-color-mode-value.tsx";
import {useColorMode} from "./components/ui/color-mode/use-color-mode.tsx";
import {type FC} from "react";

type ColorModeSwitcherProps = Omit<IconButtonProps, "aria-label">

export const ColorModeSwitcher: FC<ColorModeSwitcherProps> = (props) => {
    const {toggleColorMode} = useColorMode()
    const text = useColorModeValue("dark", "light");
    const SwitchIcon = useColorModeValue(FaMoon, FaSun);

    return (
        <IconButton
            position={"fixed"}
            bottom={8}
            left={4}
            size="md"
            fontSize="lg"
            variant="ghost"
            zIndex={99999}
            color="current"
            onClick={toggleColorMode}
            aria-label={`Switch to ${text} mode`}
            {...props}
        >
            <SwitchIcon/>
        </IconButton>
    )
}
