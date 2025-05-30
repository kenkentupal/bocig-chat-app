// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
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
  apiKey: "AIzaSyAQW87P2nBfvOX4AbCWoOuG5C650y5v5Kk",
  authDomain: "facialrecognition-4bee2.firebaseapp.com",
  databaseURL: "https://facialrecognition-4bee2-default-rtdb.firebaseio.com",
  projectId: "facialrecognition-4bee2",
  storageBucket: "facialrecognition-4bee2.appspot.com",
  messagingSenderId: "472138979010",
  appId: "1:472138979010:web:e2beae7085bc6cb5f54d5b",
  measurementId: "G-WJ8BY9M9T8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
