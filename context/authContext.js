import React, { createContext, useEffect, useState, useContext } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateCurrentUser,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig"; // Adjust the import path as needed
import { doc, getDoc, setDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {

      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        updateUserData(user.uid);

      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const updateUserData = async (userId) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let data = docSnap.data();
      setUser({
        ...user,
        username: data.username,
        email: data.email,
        profileUrl: data.profileUrl,
        uid: data.uid,
      });
    }
  };

  const login = async (email, password) => {
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  };
  const register = async (email, password, username, profileUrl) => {
    try {
      const reponse = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(reponse?.user);

      // setUser(reponse?.user);
      // setIsAuthenticated(true);

      await setDoc(doc(db, "users", reponse?.user?.uid), {
        uid: reponse?.user?.uid,
        username: username,
        email: email,
        profileUrl: profileUrl,
      });
      return { success: true, data: reponse?.user };
    } catch (e) {
      return { success: false, error: e };
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, register }}
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
