import {useEffect, useState} from "react"
import {Button, ChakraProvider, defaultSystem, IconButton} from "@chakra-ui/react"

import "./main.css";

import FrogImage from "./components/FrogImage";
import {auth, RegisterFirebaseToken} from "./FirebaseConfig";
import SignIn from "./screens/SignIn";
import ActivitySelection from "./screens/ActivitySelection";
import {ColorModeSwitcher} from "./ColorModeSwitcher";
import ViewCalendar from "./screens/ViewCalendar";
import {AiTwotoneCalendar} from "react-icons/ai";

const ActionButton = ({isViewingCalendar}: { isViewingCalendar: boolean }) => {
    return isViewingCalendar ? <ViewCalendar/> : <ActivitySelection/>;
}

export const App = () => {

    const [isSignedIn, setIsSignedIn] = useState(auth.currentUser);
    const [isViewingCalendar, setIsViewingCalendar] = useState(false);

    useEffect(() => {
        auth.onAuthStateChanged((authState) => {
            setIsSignedIn(authState);
        });
    }, [isSignedIn])

    const ToggleCalendar = () => {
        setIsViewingCalendar(!isViewingCalendar);
    }


    return (
        <ChakraProvider value={defaultSystem}>
            <ColorModeSwitcher/>
            <div className={"content-container"}>
                {!isSignedIn ? <SignIn/> : <ActionButton isViewingCalendar={isViewingCalendar}/>}
            </div>

            <FrogImage/>
            <div style={{position: "absolute", right: 8, top: 8}}>
                <IconButton aria-label={"View Calendar"} onClick={ToggleCalendar}>
                    <AiTwotoneCalendar/>
                </IconButton>
            </div>

            {isSignedIn &&
                <div style={{position: "absolute", left: 0, right: 0, bottom: 16}}>
                    <div style={{display: "flex", justifyContent: "center"}}>
                        <Button variant={"ghost"} onClick={() => RegisterFirebaseToken()}>
                            Refresh Notification
                        </Button>
                    </div>
                </div>
            }

        </ChakraProvider>
    )
}
