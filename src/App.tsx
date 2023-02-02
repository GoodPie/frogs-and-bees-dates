import * as React from "react"
import {useEffect, useState} from "react"
import {ChakraProvider, Icon, IconButton, theme,} from "@chakra-ui/react"

import "./main.css";
import FrogImage from "./components/FrogImage";
import {auth} from "./FirebaseConfig";
import SignIn from "./screens/SignIn";
import ActivitySelection from "./screens/ActivitySelection";
import {ColorModeSwitcher} from "./ColorModeSwitcher";
import ViewCalendar from "./screens/ViewCalendar";
import {AiTwotoneCalendar} from "react-icons/ai";


export const App = () => {

    const [isSignedIn, setIsSignedIn] = useState(!!(auth.currentUser ?? true));
    const [isViewingCalendar, setIsViewingCalendar] = useState(false);


    useEffect(() => {
        auth.onAuthStateChanged((authState) => {
            setIsSignedIn(!!authState);
        })
    }, [isSignedIn])

    const ToggleCalendar = () => {
        setIsViewingCalendar(!isViewingCalendar);
    }

    return (
        <ChakraProvider theme={theme}>
            <ColorModeSwitcher/>
            <div className={"content-container"}>


                {!isSignedIn ? <SignIn/> :isViewingCalendar ? <ViewCalendar/> : <ActivitySelection setShowCalendar={ToggleCalendar}/> }

            </div>

            <FrogImage/>
            <IconButton style={{position: "absolute", right: "4", top: "4"}} aria-label={"View Calendar"} icon={<Icon as={AiTwotoneCalendar} />} onClick={ToggleCalendar} />
        </ChakraProvider>
    )
}
