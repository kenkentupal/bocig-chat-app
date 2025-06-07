import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import CustomKeyboardView from "../components/CustomKeyboardView";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { useLocalSearchParams } from "expo-router";

const API_URL = "http://192.168.51.228:3000";
const OTP_LENGTH = 6;

const Verification = ({ navigation }) => {
  const params = useLocalSearchParams();
  const phone = params.phone || "";
  console.log("Verification screen params:", params); // Debug log

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const { loginWithCustomToken } = useAuth();

  // Auto-advance focus
  const handleChange = (text, idx) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[idx] = text.slice(-1);
      setOtp(newOtp);
      if (text && idx < OTP_LENGTH - 1) {
        inputs.current[idx + 1].focus();
      }
      if (newOtp.join("").length === OTP_LENGTH) {
        Keyboard.dismiss();
        handleSubmit(newOtp.join(""));
      }
    }
  };

  // Handle paste (for Android/iOS paste or autofill)
  const handlePaste = (e, idx) => {
    const pasted = e.nativeEvent.text;
    if (pasted.length === OTP_LENGTH && /^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      handleSubmit(pasted);
    }
  };

  // Placeholder for SMS auto-retrieval (to be implemented with expo-sms-retriever or similar)
  // useEffect(() => { ... }, []);

  const handleSubmit = async (code) => {
    setLoading(true);
    console.log("Submitting verification for phone:", phone, "code:", code); // Debug log
    try {
      const res = await axios.post(`${API_URL}/verify-code`, { phone, code });
      if (res.data?.token) {
        const result = await loginWithCustomToken(res.data.token);
        if (!result.success) throw result.error;
        // Optionally navigate to home or let AuthContext handle redirect
      } else {
        throw new Error("Invalid token from server");
      }
    } catch (e) {
      Alert.alert(
        "Verification Failed",
        e.response?.data?.message || e.message
      );
    }
    setLoading(false);
  };

  return (
    <CustomKeyboardView>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to your phone
        </Text>
        <View style={styles.otpContainer}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputs.current[idx] = ref)}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, idx)}
              onSubmitEditing={() =>
                idx < OTP_LENGTH - 1 && inputs.current[idx + 1].focus()
              }
              onFocus={() => {
                // Clear if user focuses and box is not first
                if (otp[idx] && idx !== 0) {
                  const newOtp = [...otp];
                  newOtp[idx] = "";
                  setOtp(newOtp);
                }
              }}
              onEndEditing={(e) => handlePaste(e, idx)}
              autoFocus={idx === 0}
              returnKeyType="next"
              textContentType={Platform.OS === "ios" ? "oneTimeCode" : "none"}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: "#b0b0b0" }]}
          onPress={() => handleSubmit(otp.join(""))}
          disabled={loading || otp.join("").length !== OTP_LENGTH}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>
      </View>
    </CustomKeyboardView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(5),
    minHeight: hp(100),
    backgroundColor: "#fff",
  },
  title: {
    fontSize: hp(3.5),
    fontWeight: "bold",
    marginBottom: hp(1),
    color: "#222",
  },
  subtitle: {
    fontSize: hp(2),
    color: "gray",
    marginBottom: hp(3),
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: hp(3),
    gap: wp(2),
  },
  otpBox: {
    width: wp(12),
    height: hp(7),
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    textAlign: "center",
    fontSize: hp(3),
    marginHorizontal: wp(1),
    color: "#222",
    fontWeight: "bold",
  },
  button: {
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
  },
  buttonText: {
    fontSize: hp(2.2),
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});

export default Verification;
