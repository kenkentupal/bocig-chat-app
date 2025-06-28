import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useAuth } from "../../context/authContext";

const db = getFirestore(getApp());
const auth = getAuth(getApp());
const storage = getStorage(getApp());

// Add a government-like color palette
const PRIMARY_COLOR = "#0057B8"; // Deep blue (PH flag blue)
const ACCENT_COLOR = "#FFD700"; // Gold (PH flag yellow)
const BG_COLOR = "#F5F6FA"; // Light background
const BORDER_COLOR = "#D1D5DB"; // Subtle border

const CompleteProfile = () => {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileUrl, setprofileUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user, updateUserData } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const phone = (route.params && route.params.phone) || user?.phone || "";

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      const fileRef = ref(
        storage,
        `profilePictures/${currentUser.uid}_${Date.now()}`
      );
      const uploadTask = uploadBytesResumable(fileRef, blob);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          setUploadProgress(snapshot.bytesTransferred / snapshot.totalBytes);
        },
        (error) => {
          setUploading(false);
          Alert.alert("Upload Error", error.message);
        },
        async () => {
          setUploading(false);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setprofileUrl(downloadURL);
          Alert.alert("Success", "Profile picture uploaded!");
        }
      );
    } catch (e) {
      setUploading(false);
      Alert.alert("Upload Error", e.message);
    }
  };

  const handleSave = async () => {
    if (!username || !firstName || !lastName) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "No authenticated user. Please log in again.");
        setLoading(false);
        return;
      }
      const userUid = currentUser.uid;
      const userDocRef = doc(db, "users", userUid);
      await setDoc(userDocRef, {
        uid: userUid,
        username: username || "",
        firstName: firstName || "",
        lastName: lastName || "",
        profileUrl: profileUrl || "",
        email: email || "",
        phone: phone || "",
        createdAt: new Date(),
      });
      await updateUserData(userUid); // <-- update context after saving
      Alert.alert("Success", "Profile completed!");
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "home" }],
      });
    } catch (e) {
      Alert.alert("Error", e.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center", // Center vertically
        alignItems: "center", // Center horizontally
        padding: wp(6),
        backgroundColor: BG_COLOR,
      }}
      style={{ backgroundColor: BG_COLOR }}
    >
      <Text
        style={{
          fontSize: hp(3.5),
          fontWeight: "bold",
          marginBottom: hp(1),
          color: PRIMARY_COLOR,
          letterSpacing: 1,
        }}
      >
        Complete Your Profile
      </Text>
      <Text
        style={{
          color: "#444",
          marginBottom: hp(2.2),
          fontSize: hp(2),
          textAlign: "center",
          maxWidth: wp(85),
        }}
      >
        Please provide your details to continue using the app.
      </Text>
      <TouchableOpacity
        onPress={pickImage}
        style={{ marginBottom: hp(2.2), alignItems: "center" }}
        disabled={uploading}
        activeOpacity={0.7}
      >
        <View
          style={{
            borderWidth: 3,
            borderColor: profileUrl ? ACCENT_COLOR : BORDER_COLOR,
            borderRadius: wp(35),
            padding: wp(1),
            backgroundColor: "#fff",
            shadowColor: PRIMARY_COLOR,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 6.0,
            elevation: 8,
          }}
        >
          {profileUrl ? (
            <Image
              source={{ uri: profileUrl }}
              style={{ width: wp(32), height: wp(32), borderRadius: wp(16) }}
            />
          ) : (
            <View
              style={{
                width: wp(32),
                height: wp(32),
                borderRadius: wp(16),
                backgroundColor: BORDER_COLOR,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#888", fontSize: hp(1.7) }}>
                Select Photo
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            color: uploading ? "#aaa" : PRIMARY_COLOR,
            textAlign: "center",
            marginTop: hp(1),
            fontWeight: "600",
          }}
        >
          {uploading
            ? `Uploading... ${Math.round(uploadProgress * 100)}%`
            : "Upload Profile Picture"}
        </Text>
        <View
          style={{
            width: "100%",
            alignItems: "center",
            marginVertical: hp(2),
          }}
        >
          <View
            style={{
              width: "90%",
              height: 1,
              backgroundColor: BORDER_COLOR,
              opacity: 0.5,
            }}
          />
        </View>
      </TouchableOpacity>
      <View style={{ width: "100%", maxWidth: 400, paddingHorizontal: wp(2) }}>
        {/* Phone number input (disabled) */}
        <TextInput
          placeholder="Phone Number"
          value={phone}
          editable={false}
          style={{
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            borderRadius: 8,
            marginBottom: hp(1.5),
            padding: hp(1.5),
            width: "100%",
            backgroundColor: "#f0f0f0",
            fontSize: hp(2),
            color: "#888",
          }}
          placeholderTextColor="#888"
        />
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            borderRadius: 8,
            marginBottom: hp(1.5),
            padding: hp(1.5),
            width: "100%",
            backgroundColor: "#fff",
            fontSize: hp(2),
          }}
          placeholderTextColor="#888"
        />
        <TextInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          style={{
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            borderRadius: 8,
            marginBottom: hp(1.5),
            padding: hp(1.5),
            width: "100%",
            backgroundColor: "#fff",
            fontSize: hp(2),
          }}
          placeholderTextColor="#888"
        />
        <TextInput
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          style={{
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            borderRadius: 8,
            marginBottom: hp(1.5),
            padding: hp(1.5),
            width: "100%",
            backgroundColor: "#fff",
            fontSize: hp(2),
          }}
          placeholderTextColor="#888"
        />
        <TextInput
          placeholder="Email (optional)"
          value={email}
          onChangeText={setEmail}
          style={{
            borderWidth: 1,
            borderColor: BORDER_COLOR,
            borderRadius: 8,
            marginBottom: hp(2.2),
            padding: hp(1.5),
            width: "100%",
            backgroundColor: "#fff",
            fontSize: hp(2),
          }}
          placeholderTextColor="#888"
          keyboardType="email-address"
        />
        <TouchableOpacity
          style={{
            backgroundColor: loading || uploading ? "#b0b0b0" : PRIMARY_COLOR,
            borderRadius: 14,
            paddingVertical: hp(2.5),
            alignItems: "center",
            marginTop: hp(2.5),
            marginBottom: hp(1),
            shadowColor: PRIMARY_COLOR,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 6.0,
            elevation: 8,
          }}
          onPress={handleSave}
          disabled={loading || uploading}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: hp(2.4),
              letterSpacing: 1,
            }}
          >
            {loading ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CompleteProfile;
