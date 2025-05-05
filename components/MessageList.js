import { ScrollView } from "react-native";
import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import FileMessage from "./FileMessage";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons } from "@expo/vector-icons";

import { View, Text, Image } from "react-native";

export default function MessageList({ messages, currentUser }) {
  const scrollViewRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    // Enhanced null checking
    if (scrollViewRef.current && messages && messages.length > 0) {
      // Delay scroll to ensure content has been rendered
      setTimeout(() => {
        // Additional null check in case ref becomes null during timeout
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages]);

  // Helper function to detect image files - same improved logic as FileMessage
  const isImageFile = (message) => {
    // Direct flags from upload handling
    if (message.isImage === true || message._isWebImage === true) return true;

    // Web-specific properties
    if (
      message._imageExtension &&
      ["jpg", "jpeg", "png", "gif", "webp"].includes(message._imageExtension)
    ) {
      return true;
    }

    // MIME type check
    if (
      message.fileType &&
      (message.fileType.startsWith("image/") ||
        message.fileType.includes("image"))
    )
      return true;

    // File extension check from filename
    if (message.fileName) {
      const lowerFileName = message.fileName.toLowerCase();
      const imageExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp",
        "svg",
      ];
      for (const ext of imageExtensions) {
        if (lowerFileName.endsWith(`.${ext}`)) return true;
      }
    }

    // URL pattern check
    if (message.fileUrl) {
      const lowerUrl = message.fileUrl.toLowerCase();
      // Check for image-specific URL patterns or extensions
      if (
        lowerUrl.includes("/image/") ||
        lowerUrl.includes("images") ||
        lowerUrl.endsWith(".jpg") ||
        lowerUrl.endsWith(".jpeg") ||
        lowerUrl.endsWith(".png") ||
        lowerUrl.endsWith(".gif") ||
        lowerUrl.includes("image-")
      ) {
        return true;
      }

      // Common cloud storage image patterns
      if (
        lowerUrl.includes("cloudinary.com") ||
        lowerUrl.includes("firebasestorage") ||
        lowerUrl.includes("storage.googleapis.com")
      ) {
        // Additional check for image-like URL patterns in cloud storage
        if (
          lowerUrl.includes("image") ||
          /\.(jpg|jpeg|png|gif|webp)/i.test(lowerUrl)
        ) {
          return true;
        }
      }
    }

    return false;
  };

  // Group consecutive image messages from the same sender
  const organizeMessages = (messages) => {
    if (!messages || messages.length === 0) return [];

    const organizedMessages = [];
    let currentGroup = null;

    messages.forEach((message, index) => {
      const isLastMessage = index === messages.length - 1;
      const isImage = isImageFile(message);

      // Check if this message can be grouped with previous ones
      const canGroupWithPrevious =
        currentGroup &&
        currentGroup.senderId === message.senderId &&
        isImage &&
        currentGroup.type === "image";

      if (canGroupWithPrevious) {
        // Add to current image group
        currentGroup.messages.push(message);
      } else {
        // If there was a previous group, add it to organized messages
        if (currentGroup) {
          organizedMessages.push(currentGroup);
        }

        // Start a new group
        if (isImage) {
          currentGroup = {
            id: message.id,
            type: "image",
            senderId: message.senderId,
            messages: [message],
            timestamp: message.createdAt,
          };
        } else {
          // Regular message (not part of a group)
          organizedMessages.push({
            type: "single",
            message,
          });
          currentGroup = null;
        }
      }

      // Handle the last message
      if (isLastMessage && currentGroup) {
        organizedMessages.push(currentGroup);
      }
    });

    return organizedMessages;
  };

  // Render a group of file messages
  const renderFileGroup = (group, isCurrentUser) => {
    return (
      <View
        key={group.id}
        className={`mb-1.5 ${isCurrentUser ? "pr-3 pl-14" : "pl-3 pr-14"}`}
      >
        <View
          className={`flex-row items-start ${
            isCurrentUser ? "justify-end" : ""
          }`}
        >
          {!isCurrentUser && (
            <View className="h-8 w-8 mr-2 mt-0.5">
              <Image
                source={{
                  uri:
                    group.messages[0].profileUrl ||
                    "https://placekitten.com/200/200",
                }}
                className="w-8 h-8 rounded-full bg-gray-300"
              />
            </View>
          )}

          <View className="max-w-[80%]">
            {/* Render image grid based on count */}
            {group.messages.length === 1 ? (
              <FileMessage
                file={group.messages[0]}
                isCurrentUser={isCurrentUser}
              />
            ) : (
              <View
                className="flex-row flex-wrap rounded-lg overflow-hidden"
                style={{
                  gap: 2,
                  maxWidth: hp(50),
                }}
              >
                {group.messages.map((msg, idx) => (
                  <FileMessage
                    key={msg.id || idx}
                    file={msg}
                    isCurrentUser={isCurrentUser}
                    isInGrid={true}
                    gridSize={group.messages.length}
                  />
                ))}
              </View>
            )}

            {/* Time display */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                marginTop: 4,
                marginLeft: isCurrentUser ? 0 : 2,
                marginRight: isCurrentUser ? 2 : 0,
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  fontSize: hp(1.5),
                  color: "#65676B",
                  marginRight: isCurrentUser ? 4 : 0,
                }}
              >
                {group.messages[group.messages.length - 1].createdAt &&
                group.messages[group.messages.length - 1].createdAt.toDate
                  ? group.messages[group.messages.length - 1].createdAt
                      .toDate()
                      .toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                  : "Just now"}
              </Text>

              {isCurrentUser && (
                <View>
                  {group.messages[group.messages.length - 1]?.seen ? (
                    <Ionicons
                      name="checkmark-done"
                      size={hp(1.6)}
                      color="#0084ff"
                    />
                  ) : (
                    <Ionicons name="checkmark" size={hp(1.6)} color="#737373" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const organizedMessages = organizeMessages(messages);

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 8 }}
      onContentSizeChange={() => {
        // More robust null checking before scrolling
        try {
          if (scrollViewRef && scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        } catch (error) {
          console.log("Scroll error:", error);
        }
      }}
    >
      {organizedMessages.map((item, index) => {
        if (item.type === "file" || item.type === "image") {
          const isCurrentUser = item.senderId === currentUser?.uid;
          return renderFileGroup(item, isCurrentUser);
        }

        // For regular text messages
        const message = item.message;
        const isCurrentUser = message.senderId === currentUser?.uid;

        return (
          <View
            key={message.id || index}
            className={`mb-1.5 ${isCurrentUser ? "pr-3 pl-14" : "pl-3 pr-14"}`}
          >
            <View
              className={`flex-row items-start ${
                isCurrentUser ? "justify-end" : ""
              }`}
            >
              {!isCurrentUser && (
                <View className="h-8 w-8 mr-2 mt-1">
                  <Image
                    source={{
                      uri:
                        message.profileUrl || "https://placekitten.com/200/200",
                    }}
                    className="w-8 h-8 rounded-full bg-gray-300"
                  />
                </View>
              )}
              <MessageItem message={message} currentUser={currentUser} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
