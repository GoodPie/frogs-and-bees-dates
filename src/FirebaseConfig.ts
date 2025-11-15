// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getAnalytics, logEvent} from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getMessaging, getToken} from "firebase/messaging";
import {doc, getFirestore, setDoc} from "firebase/firestore";
import {getAI, GoogleAIBackend} from "firebase/ai";
import {getStorage} from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCOR1-dWbW9u4MXiyrRkp12P7EB0Zb6Ud0",
    authDomain: "free-6c587.firebaseapp.com",
    projectId: "free-6c587",
    storageBucket: "free-6c587.appspot.com",
    messagingSenderId: "82366233021",
    appId: "1:82366233021:web:8469bb4e9f3fce5b8bfad4",
    measurementId: "G-3GB33SBLYM"
};


const firebaseVapidKey = "BLcNj9ILfRYiDJdVTri47hAal9tKXqJx1WmqVb2KdSZoFsuaZI8IEDPPVrpzAUea5oxmmE_9BhzfF3_ynrPXcmc";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const cloudMessaging = getMessaging(app);

/**
 * Firebase Storage instance for file uploads (e.g., recipe images)
 */
export const storage = getStorage(app);

/**
 * Firebase AI Logic instance for Gemini API access
 * Used for ingredient parsing with structured output
 */
export const ai = getAI(app, {backend: new GoogleAIBackend()});

/**
 * Requests permissions to send out notifications
 */
export const RequestNotificationPermission = async () => {
    console.debug('Requesting notification permission...');
    const permission = await Notification.requestPermission()
        .catch((err) => {
            console.error(err);
            return false;
        });

    return permission === 'granted';
}

export const RegisterFirebaseToken = async () => {

    const permissionGranted = await RequestNotificationPermission();
    if (!permissionGranted) {
        logEvent(analytics, 'notification_permission_denied', {
            message: 'User denied notification permission'
        });
        return;
    }

    const currentToken = await getToken(cloudMessaging, {vapidKey: firebaseVapidKey})
        .catch((err) => console.error("Error getting token", err));

    if (currentToken) {
        // Send the token to firebase firestore
        console.debug("Got token", currentToken);

        const userId = auth.currentUser?.uid;
        if (!userId) {
            setTimeout(() => {
                RegisterFirebaseToken();
            }, 1000);
            return;
        }

        await setDoc(doc(db, "tokens", userId), {"token": currentToken});
    } else {
        console.debug('No registration token available. Request permission to generate one.');
    }
}