import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});


exports.OnEventAdded = functions.firestore
  .document("calendarEvents/{calendarId}")
  .onCreate((snap) => {
    try {
      const data = snap.data();
      const name = data.activityName;

      // Send notification
      const payload = {
        notification: {
          title: `${name}`,
          body: "A new event was added to the calendar",
        },
        topic: "events",
      };

      return admin.messaging().send(payload);
    } catch (e) {
      console.error("Error on event added: ", e);
    }

    return null;
  });


exports.OnTokenAdded = functions.firestore
  .document("tokens/{userId}")
  .onCreate((snap) => {
    // Get the token from the document snapshot
    const token = snap.data().token;
    console.debug("Token: ", token);

    return admin.messaging().subscribeToTopic(token, "events");
  });
