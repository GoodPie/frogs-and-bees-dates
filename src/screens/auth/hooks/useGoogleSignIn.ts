import {useState, useCallback} from 'react';
import {auth} from "@/FirebaseConfig.ts";
import {toaster} from "@/components/ui/useToaster.tsx";
import {GoogleAuthProvider, signInWithPopup, type User} from 'firebase/auth';
import type {FirebaseError} from "firebase/app";


// Initialize a single provider instance
const provider = new GoogleAuthProvider();
provider.setCustomParameters({prompt: "select_account"});

export interface UseGoogleSignInResult {
    signIn: () => Promise<User | null>;
    loading: boolean;
}

// Map Firebase auth error codes to user-friendly messages
const mapErrorCode = (code?: string): string => {
    switch (code) {
        case "auth/popup-closed-by-user":
            return "The sign-in popup was closed before completing.";
        case "auth/cancelled-popup-request":
            return "Another sign-in attempt is already running.";
        case "auth/popup-blocked":
            return "Your browser blocked the popup. Enable popups and try again.";
        case "auth/network-request-failed":
            return "Network error. Check your connection and retry.";
        default:
            return "Something went wrong. Please try again.";
    }
};

export const useGoogleSignIn = (): UseGoogleSignInResult => {
    const [loading, setLoading] = useState(false);

    const signIn = useCallback(async () => {
        if (loading) return null; // Prevent duplicate popups
        setLoading(true);
        try {
            const {user} = await signInWithPopup(auth, provider);
            if (!user) {
                toaster.create({type: "error", title: "Sign-in failed", description: "No user details were returned."});
                return null;
            }
            return user;
        } catch (err: Error | FirebaseError | unknown) {
            if (err instanceof Error) {
                console.error("Error signing in with Google:", err.message);
                const description = mapErrorCode((err as FirebaseError).code);
                toaster.create({type: "error", title: "Sign-in error", description});
            } else {
                console.error("Unknown error signing in with Google:", err);
            }

            return null;
        } finally {
            setLoading(false);
        }
    }, [loading]);

    return {signIn, loading};
};

export default useGoogleSignIn;
