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
  hasUnread,
}) {
  // State
  const [isUnread, setIsUnread] = useState(false);
  const { setSelectedChatUser } = useChat();

  // Get current user safely - handle array or direct object cases
  const getCurrentUserId = () => {
    if (!currentUser) return null;
    return Array.isArray(currentUser) ? currentUser[0]?.uid : currentUser?.uid;
  };

  // Subscribe to unread state only
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId || !lastMsg) return;

    if (item.isGroup) {
      // For group chats, check if message is not seen and not sent by current user
      setIsUnread(lastMsg.senderId !== userId && lastMsg.seen === false);
    } else {
      // For 1-on-1 chats, check if message is from other user and not seen
      setIsUnread(lastMsg.senderId === item.uid && lastMsg.seen === false);
    }
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

  // Navigate to chat room when pressed
  const handlePress = () => {
    setSelectedChatUser(item);
    router.push("/chatRoom");
  };

  const renderMessagePreview = () => {
    if (item.isGroup) {
      if (!lastMsg) {
        return (
          <Text className="text-neutral-400 text-[15px]">No messages yet</Text>
        );
      }
      return (
        <Text
          className={
            isUnread
              ? "text-neutral-800 text-[15px] font-bold"
              : "text-neutral-500 text-[15px]"
          }
          numberOfLines={1}
        >
          {lastMsg.text || "(media)"}
        </Text>
      );
    }
    if (!lastMsg) {
      return <Text className="text-neutral-400 text-[15px]">Say Hi 👋</Text>;
    }

    // Get current user ID safely
    const currentUserId = getCurrentUserId();

    // Style for unread messages - bold text
    const messageTextStyle = isUnread
      ? "text-neutral-800 text-[15px] font-bold"
      : "text-neutral-500 text-[15px]";

    // Handle file message previews
    if (lastMsg.fileUrl) {
      if (lastMsg.isImage) {
        return (
          <Text className={messageTextStyle}>
            {currentUserId && lastMsg.senderId === currentUserId
              ? "You sent a photo"
              : "Sent you a photo"}
          </Text>
        );
      } else if (lastMsg.fileType && lastMsg.fileType.startsWith("video/")) {
        return (
          <Text className={messageTextStyle}>
            {currentUserId && lastMsg.senderId === currentUserId
              ? "You sent a video"
              : "Sent you a video"}
          </Text>
        );
      } else {
        return (
          <Text className={messageTextStyle}>
            📎{" "}
            {currentUserId && lastMsg.senderId === currentUserId
              ? "You sent a file"
              : "Sent you a file"}
            {lastMsg.fileName
              ? `: ${lastMsg.fileName.substring(0, 15)}${
                  lastMsg.fileName.length > 15 ? "..." : ""
                }`
              : ""}
          </Text>
        );
      }
    }

    // For regular text messages
    return (
      <Text className={messageTextStyle} numberOfLines={1}>
        {currentUserId && lastMsg.senderId === currentUserId ? "You: " : ""}
        {lastMsg.text}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      className={`flex-row justify-between mx-4 items-center gap-3 mb-4 pb-2 ${
        noBorder ? "" : "border-b border-neutral-300"
      }`}
      onPress={handlePress}
    >
      {/* User/Group Avatar with unread indicator */}
      <View className="relative">
        {item.isGroup ? (
          item.groupAvatar ? (
            <Image
              source={{ uri: item.groupAvatar }}
              style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
              className="rounded-full"
            />
          ) : (
            <View
              style={{
                height: hp(6),
                width: hp(6),
                borderRadius: 100,
                backgroundColor: "#e0e7ff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#6366f1", fontWeight: "bold", fontSize: 22 }}
              >
                {item.groupName?.[0] || "G"}
              </Text>
            </View>
          )
        ) : (
          <Image
            source={{ uri: item?.profileUrl }}
            style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
            className="rounded-full"
          />
        )}

        {/* Unread message indicator dot for both group and 1on1 */}
        {isUnread && (
          <View
            className="absolute top-0 right-0 bg-blue-500 rounded-full"
            style={{
              width: 14,
              height: 14,
              borderWidth: 2,
              borderColor: "white",
            }}
          />
        )}
      </View>

      {/* Chat Content */}
      <View className="flex-1">
        <Text
          className={`text-neutral-800 text-[17px] ${
            isUnread ? "font-bold" : "font-semibold"
          }`}
        >
          {item.isGroup ? item.groupName : item?.username || "User"}
        </Text>
        {renderMessagePreview()}
      </View>

      {/* Timestamp with unread styling */}
      {(lastMsg?.createdAt || item.createdAt) && (
        <Text
          className={`text-xs ${
            isUnread ? "text-blue-500 font-bold" : "text-gray-400"
          }`}
        >
          {formatTime(lastMsg?.createdAt || item.createdAt)}
        </Text>
      )}
    </TouchableOpacity>
  );
}
