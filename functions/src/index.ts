import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getMessaging} from "firebase-admin/messaging";
import {logger} from "firebase-functions/v2";

initializeApp();

export const onEventAdded = onDocumentCreated(
  "calendarEvents/{calendarId}",
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) {
        logger.warn("No data in document");
        return;
      }

      const name = data.activityName;

      // Send notification
      const message = {
        notification: {
          title: `${name}`,
          body: "A new event was added to the calendar",
        },
        topic: "events",
      };

      await getMessaging().send(message);
      logger.info(`Notification sent for event: ${name}`);
    } catch (e) {
      logger.error("Error on event added:", e);
      throw e;
    }
  }
);

export const onTokenAdded = onDocumentCreated(
  "tokens/{userId}",
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) {
        logger.warn("No data in document");
        return;
      }

      const token = data.token;
      logger.debug("Token:", token);

      await getMessaging().subscribeToTopic(token, "events");
      logger.info(`Token subscribed to events topic: ${token}`);
    } catch (e) {
      logger.error("Error on token added:", e);
      throw e;
    }
  }
);
