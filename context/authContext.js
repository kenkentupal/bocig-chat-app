import React, { createContext, useEffect, useState, useContext } from "react";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);
  const db = getFirestore(getApp());
  const auth = getAuth(getApp());

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Check if Firestore user document exists, create if not
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          try {
            await setDoc(docRef, {
              uid: user.uid,
              username: "",
              email: user.email || "",
              profileUrl: "",
              firstName: "",
              lastName: "",
              phone: user.phoneNumber || "",
              createdAt: new Date(),
            });
            console.log("Firestore user document created for UID:", user.uid);
          } catch (err) {
            console.error("Error creating Firestore user document:", err);
          }
        }
        await updateUserData(user.uid);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    return () => unsub();
  }, []);

  const updateUserData = async (userId) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let data = docSnap.data();
      setUser({
        username: data.username || "",
        email: data.email || "",
        profileUrl: data.profileUrl || "",
        uid: data.uid || userId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
      });
    } else {
      setUser({
        username: "",
        email: "",
        profileUrl: "",
        uid: userId,
        firstName: "",
        lastName: "",
        phone: "",
      });
    }
  };

  // Email/password login
  const login = async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await auth.signOut();
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  // Register with email/password
  const register = async (email, password, username, profileUrl) => {
    try {
      const response = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const docRef = doc(db, "users", response?.user?.uid);
      await setDoc(docRef, {
        uid: response?.user?.uid,
        username: username,
        email: email,
        profileUrl: profileUrl,
      });
      return { success: true, data: response?.user };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  // Custom token login (for phone auth)
  const loginWithCustomToken = async (token) => {
    try {
      await signInWithCustomToken(auth, token);
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        register,
        setUser,
        setIsAuthenticated,
        loginWithCustomToken,
        updateUserData, // <-- add this line
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider");
  return value;
};
// All Firestore usage now uses the latest modular Web SDK (doc, getDoc, setDoc with db from firebaseConfig)
