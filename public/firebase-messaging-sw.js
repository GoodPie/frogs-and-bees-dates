importScripts('/__/firebase/9.2.0/firebase-app-compat.js');
importScripts('/__/firebase/9.2.0/firebase-messaging-compat.js');
importScripts('/__/firebase/init.js');

firebase.initializeApp({
    apiKey: "AIzaSyCOR1-dWbW9u4MXiyrRkp12P7EB0Zb6Ud0",
    authDomain: "free-6c587.firebaseapp.com",
    projectId: "free-6c587",
    storageBucket: "free-6c587.appspot.com",
    messagingSenderId: "82366233021",
    appId: "1:82366233021:web:8469bb4e9f3fce5b8bfad4",
    measurementId: "G-3GB33SBLYM",
}, 'firebase-messaging-sw');

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] PAYLOAD NOTIFICATION: ', payload.notification);

    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});