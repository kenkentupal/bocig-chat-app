import React from "react";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";


export default function MessageItem({ message, currentUser }) {
  // Check if message is from current user
  const isCurrentUser = currentUser?.uid == message.senderId;

  // Set styles based on sender
  const containerStyle = [
    styles.container,
    {
      justifyContent: isCurrentUser ? "flex-end" : "flex-start",
      marginRight: 0,
      marginLeft: 0,
    },
  ];

  const bubbleStyle = [
    styles.bubble,
    {
      alignSelf: isCurrentUser ? "flex-end" : "flex-start",
      backgroundColor: isCurrentUser ? "#0084ff" : "#f0f0f0",
      borderColor: isCurrentUser ? "#0084ff" : "#e5e7eb",
      borderBottomLeftRadius: !isCurrentUser ? 8 : 18,
      borderBottomRightRadius: isCurrentUser ? 8 : 18,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    },
  ];

  const textColor = isCurrentUser ? "#fff" : "#050505";

  // Handle file open
  const handleOpenFile = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  // Determine message content type
  const renderMessageContent = () => {
    if (message.imageUrl) {
      // Image message
      return (
        <View>
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          {message.text && message.text !== "📷 Photo" && (
            <Text style={{ fontSize: hp(1.8), color: textColor, marginTop: 5 }}>
              {message.text}
            </Text>
          )}
        </View>
      );
    } else if (message.fileUrl) {
      // File message
      return (
        <TouchableOpacity
          style={styles.fileContainer}
          onPress={() => handleOpenFile(message.fileUrl)}
        >
          <MaterialIcons
            name="insert-drive-file"
            size={hp(3)}
            color={isCurrentUser ? "#fff" : "#0084ff"}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text
              style={{
                fontSize: hp(1.8),
                color: textColor,
                fontWeight: "bold",
              }}
              numberOfLines={1}
            >
              {message.fileName || "Document"}
            </Text>
            {message.fileSize && (
              <Text
                style={{ fontSize: hp(1.5), color: textColor, opacity: 0.7 }}
              >
                {formatFileSize(message.fileSize)}
              </Text>
            )}
          </View>
          <MaterialIcons
            name="file-download"
            size={hp(2.5)}
            color={isCurrentUser ? "#fff" : "#0084ff"}
          />
        </TouchableOpacity>
      );
    } else {
      // Text message
      return (
        <Text style={{ fontSize: hp(2), color: textColor }}>
          {message?.text}
        </Text>
      );
    }
  };

  // Format file size (bytes to KB/MB)
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <View style={containerStyle}>
      <View style={{ width: wp(70) }}>
        {/* Message bubble */}
        <View style={bubbleStyle}>{renderMessageContent()}</View>

        {/* Time and read receipt container */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: isCurrentUser ? "flex-end" : "flex-start",
            marginTop: 4,
            marginLeft: isCurrentUser ? 0 : 2,
            marginRight: isCurrentUser ? 2 : 0,
          }}
        >
          {/* Time display */}
          <Text
            style={{
              fontSize: hp(1.5),
              color: "#65676B",
              marginRight: isCurrentUser ? 4 : 0,
            }}
          >
            {message.createdAt && message.createdAt.toDate
              ? message.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now"}
          </Text>

          {/* Read receipt indicator (only shown for sent messages) */}
          {isCurrentUser && (
            <View>
              {message?.seen ? (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: "100%",
  },
  image: {
    width: wp(60),
    height: wp(60) * 0.75, // 4:3 aspect ratio
    borderRadius: 10,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    minWidth: wp(40),
  },
});
