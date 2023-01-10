import * as React from "react"
import {useEffect, useState} from "react"
import {ChakraProvider, theme,} from "@chakra-ui/react"

import "./main.css";
import FrogImage from "./components/FrogImage";
import {auth} from "./FirebaseConfig";
import SignIn from "./screens/SignIn";
import ActivitySelection from "./screens/ActivitySelection";
import {ColorModeSwitcher} from "./ColorModeSwitcher";


export const App = () => {

    const [isSignedIn, setIsSignedIn] = useState(!!(auth.currentUser ?? false));


    useEffect(() => {
        auth.onAuthStateChanged((authState) => {
            setIsSignedIn(!!authState);
        })
    }, [isSignedIn])


    return (
        <ChakraProvider theme={theme}>
            <ColorModeSwitcher/>
            <div className={"content-container"}>
                {!isSignedIn ? <SignIn/> : <ActivitySelection/>}

            </div>

            <FrogImage/>
        </ChakraProvider>
    )
}
