import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { Entypo } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

export default function ChatRoomHeader({ user, router }) {
  return (
    <Stack.Screen
      options={{
        title: "",
        headerShadowVisible: false,
        headerLeft: () => (
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Entypo name="chevron-left" size={hp(4)} color="#737373" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: user?.profileUrl }}
                style={{ height: hp(4.5), borderRadius: 100, aspectRatio: 1 }}
              />
              <Text
                style={{ fontSize: hp(2.5) }}
                className="font-semibold text-neutral-800"
              >
                {user?.username}
              </Text>
            </View>
          </View>
        ),
      }}
    />
  );
}
