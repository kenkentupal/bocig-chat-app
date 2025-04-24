// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2gCOirc52adToYPUze2VaQj9KcqKjkY8",
  authDomain: "bocchatapp-38983.firebaseapp.com",
  projectId: "bocchatapp-38983",
  storageBucket: "bocchatapp-38983.firebasestorage.app",
  messagingSenderId: "981882116564",
  appId: "1:981882116564:web:df83698e07069ff6035e41",
  measurementId: "G-W26PYZEKS5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let auth;
if (Platform.OS !== "web") {
  // For React Native, explicitly use AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  // For web, use default persistence
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app); // Initialize Firestore
export const usersRef = collection(db, "users"); // Reference to the 'users' collection
export const messagesRef = collection(db, "messages"); // Reference to the 'messages' collection
export const groupsRef = collection(db, "groups"); // Reference to the 'groups' collection
