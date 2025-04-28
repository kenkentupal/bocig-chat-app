import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState } from "react";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useChat } from "../context/chatContext";
import { db } from "../firebaseConfig";
import { getRoomId } from "../utils/common";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ChatItem({
  item,
  router,
  noBorder,
  currentUser,
  lastMsg,
}) {
  // State
  // Remove local lastMsg state, use prop instead
  const [isUnread, setIsUnread] = useState(false);
  const { setSelectedChatUser } = useChat();

  // Subscribe to unread state only
  useEffect(() => {
    // Get current user
    const user = Array.isArray(currentUser) ? currentUser[0] : currentUser;
    if (!user?.uid || !item?.uid || !lastMsg) return;

    // Set unread state if message is from other user and not seen
    setIsUnread(
      lastMsg && lastMsg.senderId === item.uid && lastMsg.seen === false
    );
  }, [currentUser, item, lastMsg]);

  // Format the timestamp for display
  const formatTime = (ts) => {
    if (!ts) return "";
    const now = new Date();
    const msgDate = ts.toDate();
    const diff = now - msgDate;

    // Show date if message is older than a day
    if (diff > 86400000)
      return msgDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

    // Otherwise show time
    return msgDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get message preview text with "You: " prefix if needed
  const getMessagePreview = () => {
    if (!lastMsg?.text) return "";

    const user = Array.isArray(currentUser) ? currentUser[0] : currentUser;
    const isFromCurrentUser = lastMsg.senderId === user?.uid;

    if (isFromCurrentUser) {
      return `You: ${lastMsg.text}`;
    }

    return lastMsg.text;
  };

  // Navigate to chat room when pressed
  const handlePress = () => {
    setSelectedChatUser(item);
    router.push("/chatRoom");
  };

  return (
    <TouchableOpacity
      className={`flex-row justify-between mx-4 items-center gap-3 mb-4 pb-2 ${
        noBorder ? "" : "border-b border-neutral-300"
      }`}
      onPress={handlePress}
    >
      {/* User Avatar */}
      <Image
        source={{ uri: item?.profileUrl }}
        style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
        className="rounded-full"
      />

      {/* Chat Content */}
      <View className="flex-1 gap-1">
        {/* Username and Timestamp */}
        <View className="flex-row justify-between items-center">
          <Text
            style={{ fontSize: hp(1.8) }}
            className={`${
              isUnread ? "font-bold" : "font-semibold"
            } text-neutral-800`}
          >
            {item?.username}
          </Text>
          <Text
            style={{
              fontSize: hp(1.6),
              color: isUnread ? "#0084ff" : "#737373",
              fontWeight: isUnread ? "bold" : "normal",
            }}
            className="font-medium"
          >
            {lastMsg?.createdAt ? formatTime(lastMsg.createdAt) : ""}
          </Text>
        </View>

        {/* Message Preview */}
        {lastMsg?.text ? (
          <View className="flex-row items-center">
            {/* Unread indicator - Messenger-style blue dot */}
            {isUnread && (
              <View className="h-2.5 w-2.5 bg-blue-500 rounded-full mr-2" />
            )}
            <Text
              style={{
                fontSize: hp(1.6),
                color: isUnread ? "#000" : "#737373",
                fontWeight: isUnread ? "600" : "normal",
              }}
              numberOfLines={1}
            >
              {getMessagePreview()}
            </Text>
          </View>
        ) : (
          // No messages yet - "Say Hi!"
          <View className="flex-row items-center gap-1">
            <MaterialCommunityIcons
              name="hand-wave"
              size={hp(2)}
              color="#fbbf24"
            />
            <Text
              style={{ fontSize: hp(1.6), color: "#737373" }}
              className="font-medium"
              numberOfLines={1}
            >
              Say Hi!
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
