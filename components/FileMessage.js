import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { FontAwesome, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { Video, ResizeMode } from "expo-av";
import * as VideoThumbnails from "expo-video-thumbnails";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Helper functions
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

const isImageFile = (file) => {
  // Log the file object for debugging

  // Direct flags from upload handling
  if (file.isImage === true || file._isWebImage === true) return true;

  // Web-specific properties
  if (
    file._imageExtension &&
    ["jpg", "jpeg", "png", "gif", "webp"].includes(file._imageExtension)
  ) {
    return true;
  }

  // MIME type check
  if (
    file.fileType &&
    (file.fileType.startsWith("image/") || file.fileType.includes("image"))
  )
    return true;

  // File extension check from filename
  if (file.fileName) {
    const lowerFileName = file.fileName.toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    for (const ext of imageExtensions) {
      if (lowerFileName.endsWith(`.${ext}`)) return true;
    }
  }

  // URL pattern check
  if (file.fileUrl) {
    const lowerUrl = file.fileUrl.toLowerCase();
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

// Main component
const FileMessage = ({
  file,
  isCurrentUser,
  isInGrid = false,
  gridSize = 1,
}) => {
  // State management
  const [modalVisible, setModalVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false); // Track if video is ready
  const [videoKey, setVideoKey] = useState(0); // Key to force remount
  const [videoEnded, setVideoEnded] = useState(false); // Track if video ended
  const [thumbnail, setThumbnail] = useState(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const videoRef = useRef(null);
  const isVideo = file.fileType && file.fileType.startsWith("video/");

  // Reset videoReady and update key when modal opens
  useEffect(() => {
    if (modalVisible) {
      setVideoReady(false);
      setVideoKey((prev) => prev + 1);
      setVideoEnded(false);
      // Pause and reset video when modal opens
      if (videoRef.current) {
        videoRef.current.pauseAsync();
        videoRef.current.setPositionAsync(0);
      }
    }
  }, [modalVisible]);

  // Generate video thumbnail when component mounts
  useEffect(() => {
    if (isVideo && file.fileUrl) {
      // Only try to generate thumbnails on native platforms
      if (Platform.OS !== "web") {
        generateThumbnail();
      } else {
        // For web, skip the thumbnail generation process
        setIsGeneratingThumbnail(false);
      }
    }
  }, [file.fileUrl]);

  // Handler to generate video thumbnail
  const generateThumbnail = async () => {
    if (!file.fileUrl) return;

    try {
      setIsGeneratingThumbnail(true);
      const { uri } = await VideoThumbnails.getThumbnailAsync(file.fileUrl, {
        time: 1000,
        quality: 0.5,
      });
      setThumbnail(uri);
    } catch (error) {
      console.log("Error generating thumbnail:", error);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  // Handler to reload and play video from start
  const handleReloadVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
        setVideoEnded(false);
      } catch (e) {}
    }
  };

  // Handler to play video after ready
  const handleVideoReady = async () => {
    setVideoReady(true);
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.playAsync();
        } catch (e) {}
      }
    }, 100);
  };

  // Handler for file press
  const handleFilePress = () => {
    // Use the isImageFile function for consistency rather than direct property check
    if (isImageFile(file) || isVideo) {
      // Show in-app modal for images and videos
      setModalVisible(true);
    } else {
      // Open browser for other file types
      Linking.openURL(file.fileUrl).catch((err) => {
        console.error("Error opening file:", err);
      });
    }
  };

  // Handler for download (web/native)
  const handleDownload = useCallback(() => {
    if (!file.fileUrl) return;

    if (Platform.OS === "web") {
      // For web, open the image in a new tab or download directly
      const link = document.createElement("a");
      link.href = file.fileUrl;
      link.download = file.fileName || "image";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For native, just open the URL which usually triggers download
      Linking.openURL(file.fileUrl).catch((err) => {
        console.error("Error opening file for download:", err);
      });
    }
  }, [file.fileUrl, file.fileName]);

  // Media preview modal
  const MediaModal = () => (
    <Modal
      animationType="fade"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => {
        if (videoRef.current) {
          videoRef.current.pauseAsync();
        }
        setModalVisible(false);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View className="flex-1 bg-black justify-center items-center">
        <SafeAreaView className="flex-1 w-full justify-center items-center">
          {/* Top buttons container - download removed */}
          <View className="absolute top-10 right-5 z-50 flex-row">
            {/* Close button only */}
            <TouchableOpacity
              onPress={() => {
                if (videoRef.current) {
                  videoRef.current.pauseAsync();
                }
                setModalVisible(false);
              }}
              className="bg-black/70 rounded-full p-3"
              style={{ elevation: 5 }}
            >
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content - fullscreen */}
          {isImageFile(file) ? (
            <Image
              source={{ uri: file.fileUrl }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
              }}
              resizeMode="contain"
            />
          ) : isVideo ? (
            <View
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Video
                key={videoKey}
                ref={videoRef}
                source={{ uri: file.fileUrl }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={true}
                isLooping={false}
                useNativeControls={true}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT,
                }}
                onReadyForDisplay={() => setVideoReady(true)}
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) setVideoEnded(true);
                }}
              />
              {!videoReady && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.9)",
                  }}
                >
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={{ color: "#fff", marginTop: 10, fontSize: 16 }}>
                    Loading video...
                  </Text>
                </View>
              )}
              {videoEnded && videoReady && (
                <TouchableOpacity
                  onPress={handleReloadVideo}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.25)",
                  }}
                  activeOpacity={0.7}
                >
                  <AntDesign name="reload1" size={64} color="#fff" />
                  <Text style={{ color: "#fff", marginTop: 10, fontSize: 18 }}>
                    Replay
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* File name at bottom removed to avoid overlap with playback buttons */}
        </SafeAreaView>
      </View>
    </Modal>
  );

  // Helper component for video fallback display
  const VideoFallback = ({ isCurrentUser, fileName }) => (
    <>
      <View className="bg-blue-500/10 rounded-full p-3 mb-2">
        <FontAwesome name="play-circle" size={hp(4)} color="#0084ff" />
      </View>
      <Text
        className="text-blue-600 font-medium text-center px-2"
        numberOfLines={1}
        style={{ fontSize: hp(1.8) }}
      >
        {fileName || "Play Video"}
      </Text>
    </>
  );

  // For image files - using improved detection
  if (
    isImageFile(file) ||
    (Platform.OS === "web" && file._forceRenderAsImage)
  ) {
    // Calculate image dimensions based on grid
    let imageWidth = hp(25);
    let imageHeight = hp(25);

    if (isInGrid) {
      if (gridSize === 2) {
        imageWidth = hp(20);
        imageHeight = hp(20);
      } else if (gridSize >= 3) {
        imageWidth = hp(12.5);
        imageHeight = hp(12.5);
      }
    }

    return (
      <>
        <TouchableOpacity
          onPress={handleFilePress}
          className={`rounded-lg overflow-hidden ${isInGrid ? "" : ""}`}
        >
          <Image
            source={{ uri: file.fileUrl }}
            className={`rounded-lg${
              isCurrentUser ? " bg-blue-100" : " bg-gray-200"
            }`}
            style={{
              width: imageWidth,
              height: imageHeight,
              margin: isInGrid ? 1 : 0,
            }}
            resizeMode="cover"
          />
        </TouchableOpacity>
        {/* Always include the modal for all images */}
        <MediaModal />
      </>
    );
  }

  // For video files
  if (isVideo) {
    // Calculate video dimensions based on grid (same as image)
    let videoWidth = hp(25);
    let videoHeight = hp(25);
    if (isInGrid) {
      if (gridSize === 2) {
        videoWidth = hp(20);
        videoHeight = hp(20);
      } else if (gridSize >= 3) {
        videoWidth = hp(12.5);
        videoHeight = hp(12.5);
      }
    }
    return (
      <>
        <TouchableOpacity
          onPress={handleFilePress}
          className={`rounded-lg overflow-hidden relative`}
        >
          <View
            className={`flex justify-center items-center rounded-lg ${
              isCurrentUser ? "bg-blue-50" : "bg-gray-100"
            }`}
            style={{ width: videoWidth, height: videoHeight }}
          >
            {Platform.OS !== "web" ? (
              // Native platform rendering with thumbnail
              isGeneratingThumbnail ? (
                <ActivityIndicator size="large" color="#0084ff" />
              ) : thumbnail ? (
                <>
                  <Image
                    source={{ uri: thumbnail }}
                    style={{
                      width: videoWidth,
                      height: videoHeight,
                      position: "absolute",
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/20 flex justify-center items-center">
                    <View className="bg-black/50 rounded-full p-2">
                      <FontAwesome name="play" size={hp(3)} color="white" />
                    </View>
                  </View>
                </>
              ) : (
                // Fallback for native if thumbnail fails
                <VideoFallback
                  isCurrentUser={isCurrentUser}
                  fileName={file.fileName}
                />
              )
            ) : (
              // Web platform rendering - stylized video preview without thumbnail
              <VideoFallback
                isCurrentUser={isCurrentUser}
                fileName={file.fileName}
              />
            )}
          </View>

          <Text
            className="text-gray-800 text-center mt-1 px-2"
            numberOfLines={1}
            style={{ fontSize: hp(1.6) }}
          >
            {file.fileName || "Video"}
          </Text>
        </TouchableOpacity>
        {/* Always include modal */}
        <MediaModal />
      </>
    );
  }

  // For other file types - original document style layout
  return (
    <TouchableOpacity
      onPress={handleFilePress}
      className={`rounded-xl overflow-hidden shadow-sm ${
        isCurrentUser ? "bg-blue-50" : "bg-gray-100"
      }`}
      style={{
        maxWidth: hp(30),
      }}
    >
      {/* Top section with icon */}
      <View
        className={`w-full flex-row items-center p-2.5 border-b ${
          isCurrentUser ? "border-blue-100" : "border-gray-200"
        }`}
      >
        <View
          className={`p-1.5 rounded-full mr-2.5 ${
            isCurrentUser ? "bg-blue-100" : "bg-white"
          }`}
        >
          <FontAwesome
            name={getFileIcon(file.fileType)}
            size={hp(2.2)}
            color="#0084ff"
          />
        </View>
        <Text
          className="text-blue-600 font-semibold flex-1"
          style={{ fontSize: hp(1.8) }}
        >
          {file.fileType?.includes("pdf")
            ? "PDF Document"
            : file.fileType?.includes("word")
              ? "Word Document"
              : file.fileType?.includes("excel")
                ? "Excel Spreadsheet"
                : file.fileType?.includes("powerpoint")
                  ? "Presentation"
                  : "Document"}
        </Text>
        <MaterialIcons name="file-download" size={hp(2.2)} color="#0084ff" />
      </View>

      {/* Bottom section with filename and size */}
      <View className="p-3">
        <Text
          className="font-medium text-gray-800 mb-1.5"
          numberOfLines={2}
          style={{ fontSize: hp(1.7), lineHeight: hp(2.2) }}
        >
          {file.fileName || "Document"}
        </Text>
        <View className="flex-row items-center">
          <MaterialIcons
            name="insert-drive-file"
            size={hp(1.6)}
            color="#65676B"
          />
          <Text className="text-gray-500 ml-1" style={{ fontSize: hp(1.3) }}>
            {formatFileSize(file.fileSize || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FileMessage;
