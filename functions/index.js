const functions = require("firebase-functions");
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

// Error handler middleware for Express
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
