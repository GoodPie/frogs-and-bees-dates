import {Button, Icon} from "@chakra-ui/react";
import { signInWithPopup } from "firebase/auth";
import {HiHeart} from "react-icons/hi";
import {auth} from "../FirebaseConfig";
import { GoogleAuthProvider } from "firebase/auth";


const SignIn = () => {

    const OnClickSignIn = async () => {

        // Try to login with Google
        const signInResult = await signInWithPopup(auth, new GoogleAuthProvider());
        if (signInResult.user == null) {
            // TODO: Show message to indicate user isn't allowed to sign in
        }

    }


    return (
        <Button onClick={OnClickSignIn} size={"lg"} rightIcon={<Icon as={HiHeart} color={"red.500"}/>} colorScheme={"green"} variant={"outline"}>
            Sign In
        </Button>
    )
}

export default SignIn;