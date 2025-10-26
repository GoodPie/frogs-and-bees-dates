/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {getMessaging} from "firebase-admin/messaging";


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 2, region: "australia-southeast1"});


exports.onEventAdded = onDocumentCreated(
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
  },
);

exports.onTokenAdded = onDocumentCreated(
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
  },
);

exports.onRecipeAdded = onDocumentCreated(
  "recipes/{recipeId}",
  async (event) => {
    try {
      const data = event.data?.data();
      if (data) {
        const name = data.name;
        const message = {
          notification: {
            title: `New Recipe: ${name}`,
            body: "A new recipe has been added",
          },
          topic: "events",
        };
        await getMessaging().send(message);
        logger.info(`Notification sent for recipe: ${name}`);
      } else {
        logger.warn("No data in document");
        return;
      }
    } catch (e) {
      logger.error("Error on recipe added:", e);
      throw e;
    }
  },
);
