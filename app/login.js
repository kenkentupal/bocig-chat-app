import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
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

const API_URL = "http://192.168.51.228:3000";
const auth = getAuth(getApp());

const Login = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, setIsAuthenticated } = useAuth();
  const router = useRouter();

  const sendCode = async () => {
    // Always convert 09xxxxxxxxx to +639xxxxxxxxx for backend
    let phoneTrimmed = phone.trim();
    if (/^09\d{9}$/.test(phoneTrimmed)) {
      phoneTrimmed = "+63" + phoneTrimmed.slice(1);
    }
    if (!/^\+639\d{9}$/.test(phoneTrimmed)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid Philippine phone number starting with 09 or +639 and 11 digits in total."
      );
      return;
    }
    console.log("Sending phone number to backend:", phoneTrimmed); // Debug log
    setLoading(true);
    try {
      await axios.post(`${API_URL}/send-code`, { phone: phoneTrimmed });
      // Navigate to verification screen and pass phone number as param using Expo Router
      router.push({
        pathname: "/verification",
        params: { phone: phoneTrimmed },
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
                  width: wp(7),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Octicons name="device-mobile" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(7),
                  flex: 1,
                  paddingLeft: wp(3),
                }}
                className="font-semibold text-neutral-700"
                placeholder="Phone number (09xxxxxxxxx or +639xxxxxxxxx)"
                placeholderTextColor="gray"
                autoCapitalize="none"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  // Only allow input that starts with +639 or 09 and numbers after
                  if (/^(\+639|09)?\d{0,9}$/.test(text)) {
                    setPhone(text);
                  }
                }}
                maxLength={13}
              />
            </View>
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
                <Text
                  style={{
                    fontSize: hp(2.2),
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  Loading...
                </Text>
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
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
};

export default Login;
