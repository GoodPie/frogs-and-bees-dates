import {Box, ChakraProvider, defaultSystem, HStack} from "@chakra-ui/react"
import {BrowserRouter} from "react-router-dom"

import "./main.css";

import FrogImage from "./components/FrogImage";
import {ColorModeSwitcher} from "./components/ColorModeSwitcher.tsx";
import {AppRouter} from "./routing/AppRouter";
import {useAuth} from "./screens/auth/hooks/useAuth.ts";
import {Navigation} from "@/screens/Navigation.tsx";

export const App = () => {
    return (
        <ChakraProvider value={defaultSystem}>
            <BrowserRouter>
                <AppContent/>
            </BrowserRouter>
        </ChakraProvider>
    )
}

// App content (separated to use routing hooks within BrowserRouter context)
const AppContent = () => {
    const {user} = useAuth();

    return (
        <HStack>
            <Box p={{sm: 4, md: 6, lg: 8}} className={"content-container"}  mb={48} w={"full"}>
                <ColorModeSwitcher/>
                <AppRouter/>
            </Box>

            <FrogImage/>

            {user && <Navigation/>}
        </HStack>
    );
};
