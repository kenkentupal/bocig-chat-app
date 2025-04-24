import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import ChatRoomHeader from "../../components/ChatRoomHeader";

export default function ChatRoom() {
  const params = useLocalSearchParams();
  const item = params.item ? JSON.parse(params.item) : null;
  console.log("item", item);
  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ChatRoomHeader user={item} />
      {/* 

      <ChatRoomHeader user={{"email": "colet@gmail.com",

       "profileUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdzngH3iazOz1DmZHoEXkdiz4yJvKgY8FtPw&s",

        "uid": "ClAzEhnn0Ndkjjg0NBtGDNMuDb62",
            
         "username": "colet"}} />
      
      */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-neutral-500">Chat Room</Text>
      </View>
    </View>
  );
}
