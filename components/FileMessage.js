import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (fileType) => {
  if (fileType && fileType.startsWith("image/")) return "file-image-o";
  if (fileType && fileType.startsWith("video/")) return "file-video-o";
  if (fileType && fileType.startsWith("audio/")) return "file-audio-o";
  if (fileType && fileType.includes("pdf")) return "file-pdf-o";
  if (fileType && (fileType.includes("word") || fileType.includes("document")))
    return "file-word-o";
  if (fileType && (fileType.includes("excel") || fileType.includes("sheet")))
    return "file-excel-o";
  if (
    fileType &&
    (fileType.includes("powerpoint") || fileType.includes("presentation"))
  )
    return "file-powerpoint-o";
  if (fileType && (fileType.includes("zip") || fileType.includes("compressed")))
    return "file-zip-o";
  return "file-o";
};

const FileMessage = ({
  file,
  isCurrentUser,
  isInGrid = false,
  gridSize = 1,
}) => {
  // Always treat as a file (no preview/modal)
  const handleFilePress = useCallback(() => {
    if (file.fileUrl) {
      Linking.openURL(file.fileUrl).catch((err) => {
        console.error("Error opening file:", err);
      });
    }
  }, [file.fileUrl]);

  const handleDownload = useCallback(() => {
    if (!file.fileUrl) return;
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = file.fileUrl;
      link.download = file.fileName || "file";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Linking.openURL(file.fileUrl).catch((err) => {
        console.error("Error opening file for download:", err);
      });
    }
  }, [file.fileUrl, file.fileName]);

  // File icon and color
  const icon = getFileIcon(file.fileType);
  const extension = file.fileName
    ? file.fileName.split(".").pop().toUpperCase()
    : "";

  return (
    <TouchableOpacity
      onPress={handleFilePress}
      className={`rounded-xl overflow-hidden shadow-sm`}
      style={{
        maxWidth: hp(30),
        backgroundColor: isCurrentUser ? "#EDF6FF" : "#F5F5F5",
        borderWidth: 1,
        borderColor: isCurrentUser ? "#E6F2FF" : "#EAEAEA",
      }}
      activeOpacity={0.8}
    >
      <View className="w-full flex-row items-center p-2.5">
        {/* File icon with extension */}
        <View className="items-center mr-3">
          <View
            style={{
              backgroundColor: "#E3F2FD",
              borderRadius: 8,
              padding: hp(1.5),
              aspectRatio: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FontAwesome name={icon} size={hp(2.5)} color="#0084ff" />
            {extension && (
              <Text
                style={{
                  fontSize: hp(1),
                  color: "#0084ff",
                  fontWeight: "bold",
                  marginTop: 2,
                }}
              >
                {extension}
              </Text>
            )}
          </View>
        </View>

        {/* File info */}
        <View className="flex-1">
          <Text
            className="font-medium text-gray-800"
            numberOfLines={1}
            style={{ fontSize: hp(1.7) }}
          >
            {file.fileName || "File"}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-500" style={{ fontSize: hp(1.3) }}>
              {formatFileSize(file.fileSize || 0)}
            </Text>
          </View>
        </View>

        {/* Download button */}
        <TouchableOpacity
          onPress={handleDownload}
          style={{
            backgroundColor: "#0084ff20",
            borderRadius: 999,
            padding: hp(0.8),
          }}
        >
          <MaterialIcons name="file-download" size={hp(2.2)} color="#0084ff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default FileMessage;
