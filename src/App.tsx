import * as React from "react"
import {useEffect, useState} from "react"
import {Button, ChakraProvider, Icon, IconButton, theme,} from "@chakra-ui/react"

import "./main.css";
import FrogImage from "./components/FrogImage";
import {auth, RegisterFirebaseToken} from "./FirebaseConfig";
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
        });
    }, [isSignedIn])

    const ToggleCalendar = () => {
        setIsViewingCalendar(!isViewingCalendar);
    }

    return (
        <ChakraProvider theme={theme}>
            <ColorModeSwitcher/>
            <div className={"content-container"}>
                {!isSignedIn ? <SignIn/> : isViewingCalendar ? <ViewCalendar/> : <ActivitySelection/> }
            </div>

            <FrogImage/>
            <div style={{position: "absolute", right: 8, top: 8}}>
                <IconButton  aria-label={"View Calendar"} icon={<Icon as={AiTwotoneCalendar} />} onClick={ToggleCalendar} />
            </div>


            <div style={{position: "absolute", left: 0, right: 0, bottom: 16}}>
                <div style={{display: "flex", justifyContent: "center"}}>
                    <Button variant={"ghost"} role={"button"} onClick={() => RegisterFirebaseToken()}>Refresh Notification</Button>
                </div>

            </div>

        </ChakraProvider>
    )
}
