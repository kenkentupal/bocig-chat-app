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

  // Function to check if a message is a video
  const isVideoFile = (message) => {
    if (message.isVideo === true || message._isWebVideo === true) return true;

    if (
      message._videoExtension &&
      ["mp4", "mov", "webm", "avi", "mkv"].includes(message._videoExtension)
    ) {
      return true;
    }

    if (
      message.fileType &&
      (message.fileType.startsWith("video/") ||
        message.fileType.includes("video"))
    )
      return true;

    if (message.fileName) {
      const lowerFileName = message.fileName.toLowerCase();
      const videoExtensions = [
        "mp4",
        "mov",
        "webm",
        "avi",
        "mkv",
        "flv",
        "wmv",
        "m4v",
      ];
      for (const ext of videoExtensions) {
        if (lowerFileName.endsWith(`.${ext}`)) return true;
      }
    }

    if (message.fileUrl) {
      const lowerUrl = message.fileUrl.toLowerCase();
      if (
        lowerUrl.includes("/video/") ||
        lowerUrl.includes("videos") ||
        /\.(mp4|mov|webm|avi|mkv)/i.test(lowerUrl) ||
        lowerUrl.includes("video-")
      ) {
        return true;
      }
    }

    return false;
  };

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
      {messages.map((message, index) => {
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
              {/* Show MessageItem for text, FileMessage for files */}
              {message.text && message.text.trim().length > 0 ? (
                <MessageItem message={message} currentUser={currentUser} />
              ) : (
                <FileMessage file={message} isCurrentUser={isCurrentUser} />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
