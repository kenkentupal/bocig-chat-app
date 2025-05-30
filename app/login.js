import { View, Text } from "react-native";
import React, { useState } from "react";
import { TextInput, Button, Alert } from "react-native";
import auth from "@react-native-firebase/auth";
import { useAuth } from "../context/authContext";

const Login = () => {
  const [phone, setPhone] = useState("+639216754833");
  const [code, setCode] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setUser, setIsAuthenticated } = useAuth();

  const sendCode = async () => {
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setConfirmResult(confirmation);
      Alert.alert("Code sent", "Check your SMS for the code.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  const confirmCode = async () => {
    if (!confirmResult) return;
    setLoading(true);
    try {
      const result = await confirmResult.confirm(code);
      // Update AuthContext so _layout.js will redirect
      setUser(result.user);
      setIsAuthenticated(true);
      Alert.alert("Success", "Logged in!");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Phone Login</Text>
      <TextInput
        placeholder="Phone number (+1234567890)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <Button
        title="Send Code"
        onPress={sendCode}
        disabled={loading || !phone}
      />
      {confirmResult && (
        <>
          <TextInput
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
          />
          <Button
            title="Confirm Code"
            onPress={confirmCode}
            disabled={loading || !code}
          />
        </>
      )}
    </View>
  );
};

export default Login;
