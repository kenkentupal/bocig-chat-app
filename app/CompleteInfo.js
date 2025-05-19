import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db, storage } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Octicons } from "@expo/vector-icons";

export default function CompleteInfo() {
  const router = useRouter();
  const { uid } = useLocalSearchParams(); // uid passed as param
  const [username, setUsername] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const saveInfo = async () => {
    setLoading(true);
    let url = "";
    try {
      if (image) {
        const imgRef = ref(storage, `profilePicture/${uid}`);
        const img = await fetch(image);
        const bytes = await img.blob();
        await uploadBytes(imgRef, bytes);
        url = await getDownloadURL(imgRef);
      }
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          username,
          profileUrl: url,
        },
        { merge: true }
      );
      router.replace("/home");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: wp(5),
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: hp(3),
          fontWeight: "bold",
          textAlign: "center",
          color: "#222",
          marginBottom: hp(1),
          letterSpacing: 1,
        }}
      >
        Complete Your Info
      </Text>
      <Text
        style={{
          fontSize: hp(1.8),
          color: "gray",
          textAlign: "center",
          marginBottom: hp(2),
        }}
      >
        Please provide your username and profile picture to finish setting up
        your account.
      </Text>
      <View style={{ alignItems: "center", marginVertical: hp(2) }}>
        <TouchableOpacity onPress={pickImage} style={{ marginBottom: 10 }}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: "#006bb3",
              }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#ccc",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#eee",
              }}
            >
              <Text style={{ color: "#888" }}>Pick Profile Picture</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View
        style={{
          height: hp(7),
          borderColor: "#e5e5e5",
          borderWidth: 1,
          backgroundColor: "#f5f5f5",
          width: wp(90),
          alignSelf: "center",
          marginBottom: hp(2),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: "100%",
          }}
        >
          <View
            style={{
              width: wp(7),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Octicons name="person" size={hp(2.7)} color="gray" />
          </View>
          <TextInput
            style={{
              fontSize: hp(2),
              height: hp(7),
              flex: 1,
              paddingLeft: wp(3),
            }}
            placeholder="Username"
            placeholderTextColor="gray"
            value={username}
            onChangeText={setUsername}
          />
        </View>
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
        onPress={saveInfo}
        disabled={loading || !username}
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
            Save Info
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
