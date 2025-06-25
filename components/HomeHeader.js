import {
  View,
  Text,
  Platform,
  StatusBar,
  Image,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native";
import React, { useEffect } from "react";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { blurhash } from "../utils/common";
import { useAuth } from "../context/authContext";
import { AntDesign, Feather } from "@expo/vector-icons";
import Profile from "../app/(app)/profile";
import EditProfile from "../app/(app)/editprofile";

const ios = Platform.OS == "ios";

export default function HomeHeader() {
  const { user, updateUserData } = useAuth();
  const { top } = useSafeAreaInsets();
  const [showProfile, setShowProfile] = React.useState(false);
  const [showEditProfile, setShowEditProfile] = React.useState(false);

  useEffect(() => {
    if (showProfile && user?.uid && typeof updateUserData === "function") {
      updateUserData(user.uid);
    }
  }, [showProfile, user?.uid, updateUserData]);

  return (
    <>
      <StatusBar backgroundColor="#818cf8" barStyle="light-content" />
      <View
        style={{ paddingTop: ios ? top : top + 10 }}
        className="flex-row items-center justify-between px-6 bg-indigo-400 pb-4 pt-2 rounded-b-3xl shadow-md"
      >
        <View>
          <Text style={{ fontSize: hp(3) }} className="text-white font-medium">
            Messages
          </Text>
        </View>

        <View>
          <TouchableOpacity onPress={() => setShowProfile(true)}>
            <Image
              source={{ uri: user?.profileUrl }}
              style={{
                height: hp(4.5),
                width: hp(4.5),
                borderRadius: 100,
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: hp(4.5),
              left: wp(7),
              zIndex: 10,
            }}
            onPress={() => setShowProfile(false)}
          >
            <AntDesign name="back" size={30} color="#fff" />
          </TouchableOpacity>
          <Profile
            onEditProfile={() => {
              setShowProfile(false);
              setShowEditProfile(true);
            }}
          />
        </View>
      </Modal>
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={{ flex: 1, backgroundColor: "white" }}>
          <EditProfile onDone={() => setShowEditProfile(false)} />
        </View>
      </Modal>
    </>
  );
}

const Divider = () => {
  return <View className="p-{1px} w-full bg-neutral-200" />;
};
