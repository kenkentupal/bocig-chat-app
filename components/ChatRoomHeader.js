import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

export default function ChatRoomHeader({ item, navigation }) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("/home");
    }
  };

  const handleCall = () => {
    // Implement call logic here
  };

  const handleVideoCall = () => {
    // Implement video call logic here
  };

  return (
    <View
      className="flex-row items-center gap-4 justify-between"
      style={{
        paddingTop: insets.top + hp(1.5),
        paddingBottom: hp(1.5),
        paddingLeft: Platform.OS === "web" ? wp(1) : wp(3),
        paddingRight: wp(3),
        paddingVertical: hp(1),
        backgroundColor: "white",
      }}
    >
      {/* Left: Back and user info */}
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={handleBack}>
          <Entypo name="chevron-left" size={hp(4)} color="#737373" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: item?.profileUrl }}
            style={{ height: hp(4.5), borderRadius: 100, aspectRatio: 1 }}
          />
          <Text
            style={{ fontSize: hp(2.5) }}
            className="font-semibold text-neutral-800"
          >
            {item?.username}
          </Text>
        </View>
      </View>
      {/* Right: Call and Video Call */}
      <View className="flex-row items-center gap-8">
        <TouchableOpacity onPress={handleCall}>
          <Ionicons name="call" size={hp(2.8)} color="#737373" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleVideoCall}>
          <Ionicons name="videocam" size={hp(2.8)} color="#737373" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
