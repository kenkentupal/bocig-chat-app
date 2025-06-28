import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
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
  deleteObject,
} from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useRoute } from "@react-navigation/native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useAuth } from "../../context/authContext";
import { AntDesign } from "@expo/vector-icons";

const db = getFirestore(getApp());
const auth = getAuth(getApp());
const storage = getStorage(getApp());

const PRIMARY_COLOR = "#0057B8";
const ACCENT_COLOR = "#FFD700";
const BG_COLOR = "#F5F6FA"; // light gray background for the whole screen
const BORDER_COLOR = "#D1D5DB";
const INPUT_BG_COLOR = "#fff"; // pure white for all input fields and label backgrounds

const EditProfile = ({ onDone }) => {
  const { user, updateUserData } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profileUrl, setprofileUrl] = useState(user?.profileUrl || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const route = useRoute();
  const phone = (route.params && route.params.phone) || user?.phone || "";

  useLayoutEffect(() => {
    // Remove navigation.setOptions({ headerShown: false });
  }, []);

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

      // Delete previous profile image if it exists and is a Firebase Storage URL
      if (
        profileUrl &&
        profileUrl.startsWith("https://") &&
        profileUrl.includes("firebasestorage.googleapis.com")
      ) {
        try {
          // Extract the storage path from the URL
          const decodePath = (url) => {
            // Example: .../o/profilePictures%2Fuid_123456789?alt=media...
            const match = url.match(/\/o\/(.*?)\?/);
            if (match && match[1]) {
              return decodeURIComponent(match[1]);
            }
            return null;
          };
          const prevPath = decodePath(profileUrl);
          if (prevPath) {
            const prevRef = ref(storage, prevPath);
            await deleteObject(prevRef);
          }
        } catch (err) {
          // Ignore errors for deleting old image
        }
      }

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

          // Update Firestore profileUrl immediately after upload
          try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(
              userDocRef,
              { profileUrl: downloadURL },
              { merge: true }
            );
            await updateUserData(currentUser.uid);
          } catch (e) {
            // Ignore Firestore update errors here
          }

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
      await updateUserData(userUid);
      Alert.alert("Success", "Profile updated!");
      setLoading(false);
      if (onDone) onDone();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        // Remove backgroundColor and padding here
      }}
      style={{ backgroundColor: "transparent" }}
      showsVerticalScrollIndicator={false}
    >
      {/* Custom Header with Back Button */}
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: hp(1),
        }}
      >
        <TouchableOpacity
          onPress={onDone}
          style={{ padding: 8, marginRight: 8 }}
        >
          <AntDesign name="left" size={30} color="#000" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: hp(2.7),
            fontWeight: "bold",
            color: PRIMARY_COLOR,
            letterSpacing: 1,
          }}
        >
          Edit Your Profile
        </Text>
      </View>
      <Text
        style={{
          color: "#444",
          marginBottom: hp(2.2),
          fontSize: hp(2),
          textAlign: "center",
          maxWidth: wp(85),
        }}
      >
        Update your details below.
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
      <View style={{ width: "100%" }}>
        {/* Phone Number */}
        <View style={{ marginBottom: hp(2.2) }}>
          <View style={{ position: "relative" }}>
            <Text
              style={{
                position: "absolute",
                top: -hp(1.8),
                left: 14,
                backgroundColor: INPUT_BG_COLOR,
                paddingHorizontal: 4,
                fontSize: hp(1.7),
                color: "#888",
                zIndex: 2,
              }}
            >
              Phone Number
            </Text>
            <TextInput
              value={phone}
              editable={false}
              style={{
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 8,
                paddingVertical: hp(1.5),
                paddingHorizontal: 14,
                width: "100%",
                backgroundColor: INPUT_BG_COLOR,
                fontSize: hp(2),
                color: "#888",
              }}
              placeholderTextColor="#888"
            />
          </View>
        </View>
        {/* Username */}
        <View style={{ marginBottom: hp(2.2) }}>
          <View style={{ position: "relative" }}>
            <Text
              style={{
                position: "absolute",
                top: -hp(1.8),
                left: 14,
                backgroundColor: INPUT_BG_COLOR,
                paddingHorizontal: 4,
                fontSize: hp(1.7),
                color: "#888",
                zIndex: 2,
              }}
            >
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={{
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 8,
                paddingVertical: hp(1.5),
                paddingHorizontal: 14,
                width: "100%",
                backgroundColor: INPUT_BG_COLOR,
                fontSize: hp(2),
                color: "#222",
              }}
              placeholderTextColor="#888"
            />
          </View>
        </View>
        {/* First Name */}
        <View style={{ marginBottom: hp(2.2) }}>
          <View style={{ position: "relative" }}>
            <Text
              style={{
                position: "absolute",
                top: -hp(1.8),
                left: 14,
                backgroundColor: INPUT_BG_COLOR,
                paddingHorizontal: 4,
                fontSize: hp(1.7),
                color: "#888",
                zIndex: 2,
              }}
            >
              First Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={{
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 8,
                paddingVertical: hp(1.5),
                paddingHorizontal: 14,
                width: "100%",
                backgroundColor: INPUT_BG_COLOR,
                fontSize: hp(2),
                color: "#222",
              }}
              placeholderTextColor="#888"
            />
          </View>
        </View>
        {/* Last Name */}
        <View style={{ marginBottom: hp(2.2) }}>
          <View style={{ position: "relative" }}>
            <Text
              style={{
                position: "absolute",
                top: -hp(1.8),
                left: 14,
                backgroundColor: INPUT_BG_COLOR,
                paddingHorizontal: 4,
                fontSize: hp(1.7),
                color: "#888",
                zIndex: 2,
              }}
            >
              Last Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={{
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 8,
                paddingVertical: hp(1.5),
                paddingHorizontal: 14,
                width: "100%",
                backgroundColor: INPUT_BG_COLOR,
                fontSize: hp(2),
                color: "#222",
              }}
              placeholderTextColor="#888"
            />
          </View>
        </View>
        {/* Email */}
        <View style={{ marginBottom: hp(2.2) }}>
          <View style={{ position: "relative" }}>
            <Text
              style={{
                position: "absolute",
                top: -hp(1.8),
                left: 14,
                backgroundColor: INPUT_BG_COLOR,
                paddingHorizontal: 4,
                fontSize: hp(1.7),
                color: "#888",
                zIndex: 2,
              }}
            >
              Email (optional)
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={{
                borderWidth: 1,
                borderColor: BORDER_COLOR,
                borderRadius: 8,
                paddingVertical: hp(1.5),
                paddingHorizontal: 14,
                width: "100%",
                backgroundColor: INPUT_BG_COLOR,
                fontSize: hp(2),
                color: "#222",
              }}
              placeholderTextColor="#888"
              keyboardType="email-address"
            />
          </View>
        </View>
        {/* Save Button */}
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

export default EditProfile;
