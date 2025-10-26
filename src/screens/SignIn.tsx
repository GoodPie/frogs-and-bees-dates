import { Button, Icon } from "@chakra-ui/react";
import { HiHeart } from "react-icons/hi";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import {auth} from "@/FirebaseConfig.ts";
import {useEffect} from "react";

const SignIn = () => {
    const { signIn, loading } = useGoogleSignIn();
    const { redirectAfterLogin } = useAuthRedirect();
    const user = auth.currentUser;


    const handleClick = async () => {
        const user = await signIn();
        if (user) {
            redirectAfterLogin();
        }
    };

    useEffect(() => {
        if (user) {
            redirectAfterLogin();
        }
    }, [redirectAfterLogin, user])

    return (
        <Button
            onClick={handleClick}
            size="lg"
            colorScheme="green"
            variant="outline"
            loading={loading}
            aria-label="Sign in with Google"
            gap={2}
        >
            Sign in with Google
            <Icon as={HiHeart} color="red.500" aria-hidden="true" />
        </Button>
    );
};

export default SignIn;