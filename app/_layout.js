import "../global.css";
import { View } from "react-native";
import React, { useEffect } from "react";
import { Slot, useSegments, useRouter } from "expo-router";
import { useAuth, AuthProvider } from "../context/authContext";
import { MenuProvider } from "react-native-popup-menu";
import { ChatProvider } from "../context/chatContext";
import { PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

const MainLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const segment = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === undefined) return;

    const inApp = segment[0] === "(app)";
    const isAuthScreen =
      segment[0] === "verification" || segment[0] === "signUp";
    const isCompleteProfile = segment[0] === "completeprofile";

    // If not authenticated, redirect to login unless already on login or auth screens
    if (!isAuthenticated) {
      if (!isAuthScreen && !isCompleteProfile && segment[0] !== "login") {
        router.replace("/login");
      }
      return;
    }

    // If authenticated but profile incomplete, redirect to completeprofile
    if (
      isAuthenticated &&
      user &&
      (!user?.username || !user?.firstName || !user?.lastName)
    ) {
      if (!isCompleteProfile) {
        router.replace("/completeprofile");
      }
      return;
    }

    // If authenticated and profile complete, redirect to home if not already in app
    if (
      isAuthenticated &&
      user &&
      user?.username &&
      user?.firstName &&
      user?.lastName &&
      !inApp &&
      segment[0] !== "home"
    ) {
      router.replace("/home");
      return;
    }
    // Otherwise, stay on current route
  }, [isAuthenticated, segment, user]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <MenuProvider>
      <AuthProvider>
        <ChatProvider>
          <MainLayout />
        </ChatProvider>
      </AuthProvider>
    </MenuProvider>
  );
}
