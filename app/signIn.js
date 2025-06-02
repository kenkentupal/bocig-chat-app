import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import React, { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Loading from "../components/Loading.js";
import { Platform } from "react-native";
import { useAuth } from "../context/authContext";
import CustomKeyboardView from "../components/CustomKeyboardView.js";
import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
export default function signIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const emailRef = useRef("");
  const passwordRef = useRef("");

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("Authorization status:", authStatus);
    }
  }

  const getToken = async () => {
    try {
      console.log("Calling getToken...");
      const token = await messaging().getToken();
      if (token) {
        console.log("FCM Token:", token);
      } else {
        console.log("No FCM token received.");
      }
      return token;
    } catch (error) {
      console.log("Error getting FCM token:", error);
    }
  };

  // Helper function to save FCM token to Firestore
  const saveFcmTokenToFirestore = async (uid, token) => {
    if (!uid || !token) return;
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { fcmToken: token });
      console.log("FCM token saved to Firestore");
    } catch (error) {
      console.log("Error saving FCM token to Firestore:", error);
    }
  };

  useEffect(() => {
    console.log("useEffect running");
    getToken();
    requestUserPermission();
  }, []);

  const handleSignIn = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert("Sign In", "Please fill in all fields.");
      return;
    }
    setLoading(true);

    const response = await login(emailRef.current, passwordRef.current);

    setLoading(false);

    if (!response.success) {
      Alert.alert(
        "Sign In",
        response.error?.message || "An error occurred. Please try again."
      );
    } else {
      // Get FCM token and save to Firestore
      try {
        const token = await getToken();
        // Get current user UID from Firebase Auth
        const user = require("firebase/auth").getAuth().currentUser;
        if (user && token) {
          await saveFcmTokenToFirestore(user.uid, token);
        }
      } catch (e) {
        console.log("Error saving FCM token after login:", e);
      }
    }
  };

  return (
    <CustomKeyboardView>
      <StatusBar style="auto" />
      <View
        style={{
          paddingHorizontal: wp(5),
          alignItems: "center",
          justifyContent: "center",
          minHeight: hp(100),
        }}
        className="flex-1"
      >
        {/*Sign in Image*/}
        <View style={{ alignItems: "center" }}>
          <Image
            style={{ height: hp(25), width: wp(50) }}
            resizeMode="contain"
            source={require("../assets/images/boclogo.png")}
          />
        </View>

        <View
          style={{
            width: wp(90),
            maxWidth: 500,
            marginTop: hp(4),
          }}
          className="gap-4"
        >
          <Text
            style={{ fontSize: hp(4) }}
            className="font-bold trackind-wider text-center text-neutral-800"
          >
            Sign In
          </Text>

          <View className="gap-2">
            <View
              style={{
                height: hp(7),
                borderColor: "#e5e5e5",
                borderWidth: 1,
                backgroundColor: "#f5f5f5",
                width: wp(90),
                alignSelf: "center",
                marginHorizontal: wp(2),
              }}
              className="flex-row px-4 items-center rounded-2xl"
            >
              <View
                style={{
                  width: Platform.OS === "web" ? wp(2) : wp(7),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Octicons name="mail" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(7),
                  flex: 1,
                  paddingLeft: Platform.OS === "web" ? wp(1) : wp(3),
                }}
                className="font-semibold text-neutral-700"
                placeholder="Email"
                placeholderTextColor="gray"
                autoCapitalize="none"
                autoCompleteType="email"
                keyboardType="email-address"
                onChangeText={(text) => (emailRef.current = text)} // Update emailRef
              />
            </View>
          </View>
          {/* Password Input Field */}
          <View className="gap-4">
            <View
              style={{
                height: hp(7),
                borderWidth: 1,
                borderColor: "#e5e5e5",
                backgroundColor: "#f5f5f5",
                width: wp(90),
                alignSelf: "center",
              }}
              className="flex-row px-4 items-center rounded-2xl"
            >
              <View
                style={{
                  width: Platform.OS === "web" ? wp(2) : wp(7),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Octicons name="lock" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(6),
                  flex: 1,
                  paddingLeft: Platform.OS === "web" ? wp(1) : wp(3),
                }}
                className="font-semibold text-neutral-700"
                placeholder="Password"
                placeholderTextColor="gray"
                secureTextEntry={true}
                autoCapitalize="none"
                onChangeText={(text) => (passwordRef.current = text)} // Update passwordRef
              />
            </View>
          </View>
          {/*Forgot Password*/}
          <TouchableOpacity
            style={{
              width: wp(90),
              alignSelf: "center",
              paddingVertical: 5,
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontSize: hp(2),
                textAlign: "right",

                color: "#006bb3",
              }}
              className="font-semibold"
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <View>
            {loading ? (
              <View className="flex-row justify-center ">
                <Loading size={hp(6.5)} />
              </View>
            ) : (
              <TouchableOpacity
                style={{
                  width: wp(90),
                  alignSelf: "center",
                  backgroundColor: "#006bb3",
                  borderRadius: 16,
                  paddingVertical: hp(1.8),
                  marginTop: hp(1),
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
                onPress={handleSignIn} // Attach handleSignIn here
              >
                <Text
                  style={{
                    fontSize: hp(2.2),
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/*signup text*/}
          {/*signup text*/}
          <View className="flex-row justify-center items-center gap-2">
            <Text
              style={{
                fontSize: hp(1.8),
                color: "gray",
                textAlign: "center",
              }}
            >
              Don't have an account?{" "}
            </Text>
            <Pressable
              onPress={() => {
                router.push("signUp");
              }}
            >
              <Text
                style={{
                  fontSize: hp(1.8),
                  color: "#006bb3", // Blue color
                  fontWeight: "bold",
                }}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
}
