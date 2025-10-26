import { Button, Icon } from "@chakra-ui/react";
import { HiHeart } from "react-icons/hi";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

const SignIn = () => {
    const { signIn, loading } = useGoogleSignIn();
    const { redirectAfterLogin } = useAuthRedirect();

    const handleClick = async () => {
        const user = await signIn();
        if (user) {
            redirectAfterLogin();
        }
    };

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