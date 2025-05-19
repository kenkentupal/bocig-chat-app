import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  LogBox,
  Pressable,
} from "react-native";
import { auth, db, storage } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPhoneNumber, updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "expo-router";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { firebaseConfig } from "../firebaseConfig";
import { StatusBar } from "expo-status-bar";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Octicons } from "@expo/vector-icons";
import CustomKeyboardView from "../components/CustomKeyboardView.js";

// Suppress reCAPTCHA fallback warning
LogBox.ignoreLogs([
  "Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.",
]);

const PH_COUNTRY_CODE = "+63";

const Login = () => {
  const [step, setStep] = useState("phone"); // phone | otp | info
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [image, setImage] = useState(null);
  const router = useRouter();
  const recaptchaVerifier = useRef(null);

  // 1. Send SMS
  const sendCode = async () => {
    setLoading(true);
    try {
      const fullPhone = phone.startsWith("0")
        ? PH_COUNTRY_CODE + phone.substring(1)
        : PH_COUNTRY_CODE + phone;
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaVerifier.current
      );
      setConfirmResult(confirmation);
      setStep("otp");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  // 2. Verify OTP
  const verifyCode = async () => {
    setLoading(true);
    try {
      const result = await confirmResult.confirm(otp);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        // Check for missing or empty username/profileUrl
        if (!data.username?.trim() || !data.profileUrl?.trim()) {
          router.replace({
            pathname: "/CompleteInfo",
            params: { uid: result.user.uid },
          });
        } else {
          router.replace("/home");
        }
      } else {
        // User does not exist, navigate to CompleteInfo
        router.replace({
          pathname: "/CompleteInfo",
          params: { uid: result.user.uid },
        });
      }
    } catch (e) {
      Alert.alert("Invalid OTP", e.message);
    }
    setLoading(false);
  };

  // 3. Pick profile image
  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!res.cancelled) {
      setImage(res.uri);
    }
  };

  // 4. Save user info
  const saveInfo = async () => {
    setLoading(true);
    let url = "";
    try {
      if (image) {
        const imgRef = ref(storage, `profilePics/${auth.currentUser.uid}`);
        const img = await fetch(image);
        const bytes = await img.blob();
        await uploadBytes(imgRef, bytes);
        url = await getDownloadURL(imgRef);
      }
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        username,
        email: auth.currentUser.phoneNumber,
        profileUrl: url,
      });
      await updateProfile(auth.currentUser, {
        displayName: username,
        photoURL: url,
      });
      router.replace("/home");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <CustomKeyboardView>
      <StatusBar style="auto" />
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      />
      <View
        style={{
          paddingHorizontal: wp(5),
          alignItems: "center",
          justifyContent: "center",
          minHeight: hp(100),
        }}
      >
        {/* Logo */}
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
        >
          <Text
            style={{
              fontSize: hp(4),
              fontWeight: "bold",
              textAlign: "center",
              color: "#222",
              letterSpacing: 1,
            }}
          >
            Sign In with Phone
          </Text>
          {/* Phone Step */}
          {step === "phone" && (
            <>
              <View
                style={{
                  height: hp(7),
                  borderColor: "#e5e5e5",
                  borderWidth: 1,
                  backgroundColor: "#f5f5f5",
                  width: wp(90),
                  alignSelf: "center",
                  marginVertical: hp(2),
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
                  placeholder="9XXXXXXXXX"
                  placeholderTextColor="gray"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>
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
                  marginBottom: hp(1),
                }}
                onPress={sendCode}
                disabled={loading || phone.length !== 10}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
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
            </>
          )}
          {/* OTP Step */}
          {step === "otp" && (
            <>
              <View
                style={{
                  height: hp(7),
                  borderColor: "#e5e5e5",
                  borderWidth: 1,
                  backgroundColor: "#f5f5f5",
                  width: wp(90),
                  alignSelf: "center",
                  marginVertical: hp(2),
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
                  <Octicons name="shield" size={hp(2.7)} color="gray" />
                </View>
                <TextInput
                  style={{
                    fontSize: hp(2),
                    height: hp(7),
                    flex: 1,
                    paddingLeft: wp(3),
                  }}
                  className="font-semibold text-neutral-700"
                  placeholder="6-digit code"
                  placeholderTextColor="gray"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={6}
                />
              </View>
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
                  marginBottom: hp(1),
                }}
                onPress={verifyCode}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontSize: hp(2.2),
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
          {/* REMOVE Divider and Email Sign In Link */}
        </View>
      </View>
    </CustomKeyboardView>
  );
};

export default Login;
