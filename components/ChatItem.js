import { View, Text, Touchable, TouchableOpacity, Image } from "react-native";
import React from "react";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
export default function ChatItem({ item, router, noBorder }) {
  const openChatRoom = () => {
    console.log("item", item);
    router.push({
      pathname: `/chatRoom`,
      params: { item: JSON.stringify(item) },
    });
  };

  return (
    <TouchableOpacity
      className={`flex-row justify-between mx-4 items-center gap-3 mb-4 pb-2 ${
        noBorder ? "" : "border-b border-neutral-300"
      }`}
      onPress={openChatRoom}
    >
      <Image
        source={{ uri: item?.profileUrl }}
        style={{
          height: hp(6),
          width: hp(6),
          borderRadius: 100,
        }}
        className="rounded-full"
      />

      {/* name and last message */}

      <View className="flex-1 gap-1">
        <View className="flex-row justify-between">
          <Text
            style={{ fontSize: hp(1.8) }}
            className="font-semibold text-neutral-800"
          >
            {item?.username}
          </Text>

          <Text
            style={{ fontSize: hp(1.6) }}
            className="font-medium text-neutral-500"
          >
            time
          </Text>
        </View>
        <Text
          style={{ fontSize: hp(1.6) }}
          className="font-medium text-neutral-500"
        >
          Last message content here
        </Text>
      </View>
    </TouchableOpacity>
  );
}
