import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getApp } from "firebase/app";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Octicons } from "@expo/vector-icons";
import CustomKeyboardView from "../components/CustomKeyboardView";

const API_URL =
  "https://us-central1-facialrecognition-4bee2.cloudfunctions.net/api";
const auth = getAuth(getApp());

const Login = () => {
  const [inputFocused, setInputFocused] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, setIsAuthenticated } = useAuth();
  const router = useRouter();

  const sendCode = async () => {
    let phoneTrimmed = phone.trim();
    if (!/^\d{10}$/.test(phoneTrimmed)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Philippine mobile number."
      );
      return;
    }
    const fullPhone = "+63" + phoneTrimmed;
    console.log("Sending phone number to backend:", fullPhone); // Debug log
    setLoading(true);
    try {
      await axios.post(`${API_URL}/send-code`, { phone: fullPhone });
      // Navigate to verification screen and pass phone number as param using Expo Router
      router.push({
        pathname: "/verification",
        params: { phone: fullPhone },
      });
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || e.message);
    }
    setLoading(false);
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
            Phone Login
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
                  width: wp(14),
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                }}
              >
                <Text
                  style={{ fontSize: hp(2), color: "gray", fontWeight: "600" }}
                >
                  +63
                </Text>
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(7),
                  flex: 1,
                  paddingLeft: wp(3),
                }}
                className="font-semibold text-neutral-700"
                placeholder="Enter mobile number"
                placeholderTextColor="gray"
                autoCapitalize="none"
                keyboardType="number-pad"
                value={phone}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onChangeText={(text) => {
                  // Only allow up to 10 digits, numbers only
                  if (/^\d{0,10}$/.test(text)) {
                    setPhone(text);
                  }
                }}
                maxLength={10}
              />
            </View>
            {(inputFocused || phone.length > 0) && (
              <Text
                style={{
                  color: "gray",
                  fontSize: hp(1.5),
                  marginTop: hp(1),
                  textAlign: "left",
                }}
              >
                We will use your information to personalize and improve your
                experience and send service updates. We may use your data as
                described in our Privacy Policy and Supplemental Privacy Policy
                for Philippines. By clicking the button below, you agree to our
                Subscriber Agreement, Privacy Policy and Supplemental Privacy
                Policy for Philippines. This site is protected by reCAPTCHA.
              </Text>
            )}
          </View>
          {/* Remove code input and confirm button, handled in Verification screen */}
          <View style={{ marginTop: hp(2) }}>
            <TouchableOpacity
              style={{
                width: wp(90),
                alignSelf: "center",
                backgroundColor: loading ? "#b0b0b0" : "#006bb3",
                borderRadius: 16,
                paddingVertical: hp(1.8),
                marginTop: hp(1),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={sendCode}
              disabled={loading || !phone}
            >
              {loading ? (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(2.2),
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "700",
                      marginRight: 8,
                    }}
                  >
                    Loading
                  </Text>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: hp(2.2),
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  Send Code
                </Text>
              )}
            </TouchableOpacity>
            {/* Having Trouble Link */}
            <TouchableOpacity
              style={{
                alignSelf: "center",
                marginTop: hp(3), // Increased spacing
              }}
              onPress={() => {
                const email = "support@example.com";
                const subject = encodeURIComponent("Login Help Needed");
                const body = encodeURIComponent(
                  "Hi, I am having trouble logging in."
                );
                const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
                import("react-native").then((RN) => {
                  RN.Linking.openURL(mailtoUrl);
                });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#888",
                  fontStyle: "italic",
                  textDecorationLine: "underline",
                  textAlign: "center",
                  fontWeight: "400",
                }}
              >
                Having Trouble?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* App version at the bottom */}
        <View
          style={{
            position: "absolute",
            bottom: hp(2),
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "gray", fontSize: hp(1.7) }}>v1.0.0</Text>
        </View>
      </View>
    </CustomKeyboardView>
  );
};

export default Login;
