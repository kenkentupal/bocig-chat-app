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
import { Octicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Loading from "../components/Loading.js"; // Import the Loading component
import CustomKeyboardView from "../components/CustomKeyboardView.js";

export default function signUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const emailRef = useRef("");
  const passwordRef = useRef("");
  const usernameRef = useRef(""); // Added usernameRef
  const profileUrlRef = useRef(""); // Added profileUrlRef

  const handleRegister = () => {
    if (
      !emailRef.current ||
      !passwordRef.current ||
      !usernameRef.current ||
      !profileUrlRef.current
    ) {
      Alert.alert("Sign Up", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    console.log("Registering user:", {
      email: emailRef.current,
      password: passwordRef.current,
      username: usernameRef.current, // Added username
      profileUrl: profileUrlRef.current, // Added profileUrl
    });
  };

  return (
    <CustomKeyboardView>
      <StatusBar style="auto" />
      <View
        style={{
          paddingTop: hp(8),
          paddingHorizontal: wp(5),
        }}
        className="flex-1 gap-12"
      >
        {/*Sign in Image*/}
        <View classname="items-center">
          <Image
            style={{ height: hp(25), alignSelf: "center" }}
            resizeMode="contain"
            source={require("../assets/images/boclogo.png")}
          />
        </View>

        {/* Sign Up Text and Input Fields */}
        <View className="gap-4">
          <Text
            style={{ fontSize: hp(4) }}
            className="font-bold trackind-wider text-center text-neutral-800"
          >
            Sign Up
          </Text>

          {/* Username Input Field */}
          <View className="gap-2">
            <View
              style={{
                height: hp(7),
                borderColor: "#e5e5e5",
                borderWidth: 1,
                backgroundColor: "#f5f5f5",
                width: wp(90), // Set explicit width
                alignSelf: "center",
                marginHorizontal: wp(2),
              }}
              className="flex-row px-4 items-center rounded-2xl"
            >
              <View style={{ width: wp(7) }}>
                <Feather name="user" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(6),
                  flex: 1,
                  paddingLeft: wp(1),
                }}
                className="font-semibold text-neutral-700"
                placeholder="Username"
                placeholderTextColor="gray"
                autoCapitalize="none"
                autoCompleteType="username"
                onChangeText={(text) => (usernameRef.current = text)} // Update emailRef
              />
            </View>
          </View>

          {/* Email Address Input Field */}
          <View className="gap-2">
            <View
              style={{
                height: hp(7),
                borderColor: "#e5e5e5",
                borderWidth: 1,
                backgroundColor: "#f5f5f5",
                width: wp(90), // Set explicit width
                alignSelf: "center",
                marginHorizontal: wp(2),
              }}
              className="flex-row px-4 items-center rounded-2xl"
            >
              <View style={{ width: wp(7) }}>
                <Octicons name="mail" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(6),
                  flex: 1,
                  paddingLeft: wp(1),
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
              <View style={{ width: wp(7) }}>
                <Octicons name="lock" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(6),
                  flex: 1,
                  paddingLeft: wp(1),
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

          {/* Profile URL Field */}
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
              <View style={{ width: wp(7) }}>
                <Feather name="image" size={hp(2.7)} color="gray" />
              </View>
              <TextInput
                style={{
                  fontSize: hp(2),
                  height: hp(6),
                  flex: 1,
                  paddingLeft: wp(1),
                }}
                className="font-semibold text-neutral-700"
                placeholder="Profile URL"
                placeholderTextColor="gray"
                autoCapitalize="none"
                onChangeText={(text) => (profileUrlRef.current = text)} // Update passwordRef
              />
            </View>
          </View>

          {/*Register Button*/}
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
                onPress={handleRegister} // Attach handleSignIn here
              >
                <Text
                  style={{
                    fontSize: hp(2.2),
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "700",
                  }}
                >
                  Register
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/*Sign In text*/}
          <View className="flex-row justify-center items-center gap-2">
            <Text
              style={{
                fontSize: hp(1.8),
                color: "gray",
                textAlign: "center",
                marginTop: hp(1),
              }}
            >
              Already have an account?{" "}
              <Pressable
                onPress={() => {
                  router.push("signIn"); // Correct the route to "signUp"
                }}
              >
                <Text
                  style={{
                    fontSize: hp(1.8),
                    color: "#006bb3", // Blue color
                    fontWeight: "bold",
                  }}
                >
                  Sign In
                </Text>
              </Pressable>
            </Text>
          </View>
        </View>
      </View>
    </CustomKeyboardView>
  );
}
