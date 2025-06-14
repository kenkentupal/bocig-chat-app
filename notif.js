console.log("index.js loaded");

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendMessageNotification = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  async (snap, context) => {
    console.log("sendMessageNotification function START");
    try {
      // Log entire message document
      const message = typeof snap.data === "function" ? snap.data() : snap.data;
      console.log("New message created:", JSON.stringify(message));
      // Robust receiverId extraction
      let recipientId = message.receiverId;
      if (
        !recipientId &&
        message._fieldsProto &&
        message._fieldsProto.receiverId
      ) {
        recipientId = message._fieldsProto.receiverId.stringValue;
      }
      if (!recipientId) {
        console.log("ERROR: No receiverId found in message");
        return null;
      }

      console.log("Recipient ID:", recipientId);
      const senderName = message.senderName || "Someone";

      // Log before fetching user document
      console.log("Fetching user document for recipientId:", recipientId);
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get();

      // Log user document
      console.log("User document fetched:", JSON.stringify(userDoc.data()));

      if (!userDoc.exists) {
        console.log("ERROR: User document does not exist for ID:", recipientId);
        console.log("Returning null due to missing user document");
        return null;
      }

      const fcmToken = userDoc.data()?.fcmToken;
      console.log("Fetched fcmToken:", fcmToken);

      if (!fcmToken) {
        console.log("ERROR: No FCM token for user:", recipientId);
        console.log("Returning null due to missing FCM token");
        return null;
      }

      console.log("Found FCM token:", fcmToken);

      // Remove roomId from payload and code
      const messagePayload = {
        token: fcmToken,
        notification: {
          title: `New message from ${senderName}`,
          body: "You have a new message!",
        },
        // No data.roomId
      };

      console.log(
        "Sending notification with payload:",
        JSON.stringify(messagePayload)
      );

      // Only send notification, use correct FCM API
      try {
        const response = await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: `New message from ${senderName}`,
            body: "You have a new message!",
          },
        });
        console.log(
          "Notification sent successfully:",
          JSON.stringify(response)
        );
        return response;
      } catch (error) {
        console.error("Error sending notification:", error);
        if (error && error.errorInfo) {
          console.error("Error info:", JSON.stringify(error.errorInfo));
        }
        return null;
      }
    } catch (error) {
      console.error("Function error:", error);
      return null;
    }
  }
);
