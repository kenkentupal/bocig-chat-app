const functions = require("firebase-functions/v1");
const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// Use environment variables for Twilio credentials (Firebase v2)
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

admin.initializeApp(); // Use default credentials in Firebase environment

console.log("Firebase Function loaded successfully"); // For Cloud Run startup logs

// Health check endpoint for Cloud Run
app.get("/", (req, res) => {
  res.status(200).send("API is running");
});

// Send code endpoint
app.post("/send-code", async (req, res) => {
  let { phone } = req.body;
  phone = (phone || "").trim();
  // Validate E.164 format for PH: +639XXXXXXXXX
  if (!/^\+639\d{9}$/.test(phone)) {
    console.log("Rejected phone (invalid E.164):", phone);
    return res
      .status(400)
      .json({ message: "Phone number must be in E.164 format: +639XXXXXXXXX" });
  }
  try {
    console.log("Twilio To parameter:", phone); // Debug log
    await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Verify code endpoint
app.post("/verify-code", async (req, res) => {
  const { phone, code } = req.body;
  console.log("Verify endpoint phone:", phone, "code:", code); // Debug log
  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    if (verification.status === "approved") {
      // Check if user exists by phone number
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByPhoneNumber(phone);
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          // Create new user with phone number only (let Firebase generate UID and provider)
          userRecord = await admin.auth().createUser({
            phoneNumber: phone,
          });
        } else {
          throw err;
        }
      }
      // Generate Firebase custom token with the user's UID
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      res.json({ success: true, token: customToken });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (e) {
    console.error("/verify-code error:", e); // Log full error object
    res.status(400).json({ message: e.message });
  }
});

// Export the Express app as a Firebase Function (Gen 2)
exports.api = functions
  .region("asia-southeast1")
  .runWith({
    cpu: 1, // Remove or adjust as needed
    memory: "512MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(app);

// Notification Cloud Function (Gen 2)
exports.sendMessageNotification = functions
  .region("asia-southeast1")
  .runWith({
    cpu: 1, // Remove or adjust as needed
    memory: "512MB",
    timeoutSeconds: 60,
  })
  .firestore.document("rooms/{roomId}/messages/{messageId}")
  .onWrite((change, context) => {
    // Only run on document creation
    if (!change.before.exists && change.after.exists) {
      const snap = change.after;
      console.log("sendMessageNotification function START");
      const message = snap.data();
      console.log("New message created:", JSON.stringify(message));
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

      // Fetch user document for recipientId
      return admin
        .firestore()
        .collection("users")
        .doc(recipientId)
        .get()
        .then((userDoc) => {
          console.log("User document fetched:", JSON.stringify(userDoc.data()));
          if (!userDoc.exists) {
            console.log(
              "ERROR: User document does not exist for ID:",
              recipientId
            );
            return null;
          }
          const fcmToken = userDoc.data() && userDoc.data().fcmToken;
          console.log("Fetched fcmToken:", fcmToken);
          if (!fcmToken) {
            console.log("ERROR: No FCM token for user:", recipientId);
            return null;
          }
          console.log("Found FCM token:", fcmToken);

          const messagePayload = {
            token: fcmToken,
            notification: {
              title: `New message from ${senderName}`,
              body: "You have a new message!",
            },
          };

          console.log(
            "Sending notification with payload:",
            JSON.stringify(messagePayload)
          );

          return admin
            .messaging()
            .send({
              token: fcmToken,
              notification: {
                title: `${senderName}`,
                body: "You have a new message!",
              },
            })
            .then((response) => {
              console.log(
                "Notification sent successfully:",
                JSON.stringify(response)
              );
              return response;
            })
            .catch((error) => {
              console.error("Error sending notification:", error);
              if (error && error.errorInfo) {
                console.error("Error info:", JSON.stringify(error.errorInfo));
              }
              return null;
            });
        })
        .catch((error) => {
          console.error("Function error:", error);
          return null;
        });
    } else {
      // Not a create event
      return null;
    }
  });
// Error handler middleware for Express
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({ message: "Internal server error" });
});
