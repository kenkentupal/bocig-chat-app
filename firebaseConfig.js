// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj1Pe4dnvmMbSOIC8-Mt0FgJ_2v3dxsP4",
  authDomain: "facialrecognition-4bee2.firebaseapp.com",
  databaseURL: "https://facialrecognition-4bee2-default-rtdb.firebaseio.com",
  projectId: "facialrecognition-4bee2",
  storageBucket: "facialrecognition-4bee2.appspot.com",
  messagingSenderId: "472138979010",
  appId: "1:472138979010:web:d6cf2eae313009f0f54d5b",
  measurementId: "G-WM835XFDHW",
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with platform-specific persistence
let auth;
// Only use initializeAuth for React Native (mobile only)
auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };
export const db = getFirestore(app); // Initialize Firestore
export const usersRef = collection(db, "users"); // Reference to the 'users' collection
export const messagesRef = collection(db, "messages"); // Reference to the 'messages' collection
export const groupsRef = collection(db, "groups"); // Reference to the 'groups' collection

// Initialize Firebase Storage
export const storage = getStorage(app);
