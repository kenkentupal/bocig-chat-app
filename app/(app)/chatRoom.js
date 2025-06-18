import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  Pressable,
  Platform,
  BackHandler,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useChat } from "../../context/chatContext";
import { useAuth } from "../../context/authContext";
import ChatRoomHeader from "../../components/ChatRoomHeader";
import MessageList from "../../components/MessageList";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import { getRoomId } from "../../utils/common";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { createUploadTask, cancelActiveUpload } from "../../utils/storageUtils";
import {
  setDoc,
  doc,
  serverTimestamp,
  collection,
  addDoc,
  writeBatch,
  getDocs,
  where,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import * as ScreenCapture from "expo-screen-capture";
import NetInfo from "@react-native-community/netinfo";

export default function ChatRoom() {
  // Hooks
  const router = useRouter();
  const { selectedChatUser: item, setSelectedChatUser } = useChat();
  const { user } = useAuth();
  const { roomId, key } = useLocalSearchParams();

  // Modal visibility state
  const [modalVisible, setModalVisible] = useState(true);

  // Fetch group/user data if roomId changes (for remount/refresh)
  useEffect(() => {
    if (!roomId) return;
    let unsubscribe;
    const fetchRoom = async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("../../firebaseConfig");
        const docRef = doc(db, "rooms", roomId);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setSelectedChatUser({ ...docSnap.data(), uid: roomId });
          }
        });
      } catch (e) {
        // fallback: do nothing
      }
    };
    fetchRoom();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId, setSelectedChatUser]);

  // Guard: if user is not loaded, show nothing or a loader
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-500">Loading user...</Text>
      </View>
    );
  }

  // Handle case where page is reloaded and selectedChatUser is lost
  useEffect(() => {
    if (!item?.uid) {
      // router.replace("/home");
    }
  }, [item, router, setSelectedChatUser]);

  // State
  const [inputValue, setInputValue] = useState("");
  const [inputHeight, setInputHeight] = useState(hp(5.5));
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]); // For optimistic UI
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Refs
  const textRef = useRef("");
  const inputRef = useRef(null);
  const messageListRef = useRef(null); // Add ref for MessageList

  // Add new state variables
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Function to pick images - restrict to images only and force image type
  const pickImage = async () => {
    try {
      // Native platforms only
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only images
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        uploadAndSendFile(selectedAsset);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error picking image:", error.message);
    }
  };

  // Function to pick images or videos
  const pickMedia = async () => {
    try {
      // Native platforms only
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // Add isImage/isVideo flags for consistency
        const isImage =
          selectedAsset.type === "image" ||
          (selectedAsset.mimeType &&
            selectedAsset.mimeType.startsWith("image/"));
        const isVideo =
          selectedAsset.type === "video" ||
          (selectedAsset.mimeType &&
            selectedAsset.mimeType.startsWith("video/"));
        uploadAndSendFile({ ...selectedAsset, isImage, isVideo });
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error picking media:", error.message);
    }
  };

  // Function to pick documents
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
        ],
        copyToCacheDirectory: true,
      });

      if (
        result.canceled === false &&
        result.assets &&
        result.assets.length > 0
      ) {
        const selectedDoc = result.assets[0];
        uploadAndSendFile(selectedDoc);
      }
    } catch (error) {
      Alert.alert("Error picking document:", error.message);
    }
  };

  // Upload and send file - modified with better error handling
  const uploadAndSendFile = async (file) => {
    if (!user?.uid || !item?.uid) return;

    // Validate file object first
    if (!file) {
      console.error("File object is undefined");
      Alert.alert("Error", "Invalid file object");
      return;
    }

    console.log("File object received:", JSON.stringify(file, null, 2));

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Native platform handling only
      if (!file.uri) {
        throw new Error("File URI is missing");
      }
      const uriParts = file.uri.split(".");
      const fileExtension =
        uriParts.length > 1
          ? uriParts[uriParts.length - 1].toLowerCase()
          : "unknown";
      const fileType = file.mimeType || file.type || `file/${fileExtension}`;
      const fileName =
        file.name || `File_${new Date().getTime()}.${fileExtension}`;
      const fileSize = file.fileSize || file.size || 0;
      const isImage =
        fileType.startsWith("image/") ||
        ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExtension);
      const fileObj = file;
      // Use correct roomId for group or 1-to-1 chat
      let roomId = item?.isGroup ? item.uid : getRoomId(user.uid, item.uid);
      const filePath = `chats/${roomId}/files/${new Date().getTime()}_${fileName.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      let uploadResult;
      try {
        uploadResult = await createUploadTask(fileObj, filePath, (progress) => {
          setUploadProgress(progress);
        });
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        Alert.alert(
          "Upload failed",
          uploadError.message || "Could not upload file"
        );
        setIsUploading(false);
        return;
      }
      if (uploadResult.canceled || !uploadResult.url) {
        setIsUploading(false);
        return;
      }
      // Ensure room exists before sending file message
      await createRoomIfNotExists();
      const docRef = doc(db, "rooms", roomId);
      const messageRef = collection(docRef, "messages");
      const messageData = {
        senderId: user?.uid,
        receiverId: item?.isGroup ? null : item?.uid,
        text: "",
        fileUrl: uploadResult.url,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        isImage: isImage,
        profileUrl: user?.profileUrl,
        senderName: user?.username,
        createdAt: serverTimestamp(),
        seen: false,
        ...(item?.isGroup ? { groupId: item.uid, isGroup: true } : {}),
      };
      await addDoc(messageRef, messageData);
    } catch (error) {
      console.error("Error during file upload:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  // Show/hide attachment menu with animation
  const toggleAttachmentMenu = useCallback(() => {
    if (showAttachmentOptions) {
      // Hide menu
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowAttachmentOptions(false));
    } else {
      // Show menu
      setShowAttachmentOptions(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showAttachmentOptions, slideAnimation]);

  // Create a chat room if it doesn't exist
  const createRoomIfNotExists = async () => {
    let roomId;
    let usersArr;
    let groupName = null;
    let groupAvatar = null;
    if (item?.isGroup) {
      // Group chat
      roomId = item.uid;
      usersArr = item.users; // This should be an array
      groupName = item.groupName || null;
      groupAvatar = item.groupAvatar || null;
    } else {
      // 1-to-1 chat
      roomId = getRoomId(user?.uid, item?.uid);
      usersArr = [user.uid, item.uid];
    }
    await setDoc(
      doc(db, "rooms", roomId),
      {
        roomId,
        users: usersArr, // Always an array
        isGroup: !!item?.isGroup,
        groupName,
        groupAvatar,
        lastMessage: null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  // Mark messages from the other user as seen
  const markMessagesAsSeen = async () => {
    if (!user?.uid || !item?.uid) return;

    try {
      let roomId = item?.isGroup ? item.uid : getRoomId(user?.uid, item?.uid);
      const docRef = doc(db, "rooms", roomId);
      const messageRef = collection(docRef, "messages");

      // Query unread messages from the other user
      const q = query(
        messageRef,
        where("senderId", "==", item.uid),
        where("seen", "==", false)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return;

      // Batch update all messages to seen=true
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { seen: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    setInputValue(""); // Clear input immediately for instant UI
    let message = textRef.current.trim();
    textRef.current = "";
    if (!message) return;

    // Optimistically add message to pendingMessages
    const tempId = `pending-${Date.now()}`;
    const pendingMsg = {
      id: tempId,
      senderId: user?.uid,
      receiverId: item?.isGroup ? null : item?.uid,
      text: message,
      profileUrl: user?.profileUrl,
      senderName: user?.username,
      createdAt: new Date(),
      seen: false,
      isPending: true,
      ...(item?.isGroup ? { groupId: item.uid, isGroup: true } : {}),
    };
    setPendingMessages((prev) => [...prev, pendingMsg]);

    // Scroll to bottom after sending
    if (messageListRef.current && messageListRef.current.scrollToEnd) {
      setTimeout(() => {
        messageListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }

    // Check internet connection before sending
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert("No Internet", "Please check your internet connection");
      // Keep the pending message with 'sending...' status
      return;
    }

    try {
      // Ensure room exists before sending message
      await createRoomIfNotExists();
      let roomId = item?.isGroup ? item.uid : getRoomId(user?.uid, item?.uid);
      const docRef = doc(db, "rooms", roomId);
      const messageRef = collection(docRef, "messages");

      // Add message to Firestore
      await addDoc(messageRef, {
        senderId: user?.uid,
        receiverId: item?.isGroup ? null : item?.uid,
        text: message,
        profileUrl: user?.profileUrl,
        senderName: user?.username,
        createdAt: serverTimestamp(),
        seen: false,
        ...(item?.isGroup ? { groupId: item.uid, isGroup: true } : {}),
      });

      // Remove from pendingMessages on success
      setPendingMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } catch (error) {
      // Keep the pending message with 'sending...' status
      Alert.alert("Error sending message: ", error);
    }
  };

  // Listen for messages and mark as seen
  useEffect(() => {
    if (!user?.uid || !item?.uid) return;

    // Use correct roomId for group or 1-to-1
    let roomId = item?.isGroup ? item.uid : getRoomId(user?.uid, item?.uid);
    const docRef = doc(db, "rooms", roomId);
    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("createdAt", "asc"));

    let unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Update messages state
      let messages = querySnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });

      // Filter out pendingMessages that already have a matching confirmed message
      const filteredPendingMessages = pendingMessages.filter((pendingMsg) => {
        return !messages.some(
          (msg) =>
            msg.text === pendingMsg.text &&
            msg.senderId === pendingMsg.senderId &&
            Math.abs(
              new Date(msg.createdAt?.toDate?.() || msg.createdAt).getTime() -
                new Date(pendingMsg.createdAt).getTime()
            ) < 60000
        );
      });

      // Update state with new messages and filtered pending messages
      setMessages(messages);
      setPendingMessages(filteredPendingMessages);

      // Mark messages as seen when loaded
      markMessagesAsSeen();
    });

    return () => unsubscribe();
  }, [item, user]);

  // Prevent screenshots in this screen
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      // Allow screenshots again when leaving
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    const onHardwareBack = () => {
      if (router.canGoBack && router.canGoBack()) {
        router.back();
      } else {
        router.replace("/home");
      }
      return true; // prevent default (minimize)
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack
    );
    return () => subscription.remove();
  }, [router]);

  // Mobile view - bottom sheet modal only
  const renderAttachmentMenu = () => {
    return (
      <Modal
        transparent={true}
        visible={showAttachmentOptions}
        animationType="none"
        onRequestClose={toggleAttachmentMenu}
      >
        <Pressable
          className="flex-1 bg-black/30"
          onPress={toggleAttachmentMenu}
        >
          <Animated.View
            className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-lg"
            style={{
              transform: [
                {
                  translateY: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            }}
          >
            {/* Header */}
            <View className="border-b border-gray-200 pt-2 pb-4">
              <View className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <Text className="text-lg font-semibold text-center">
                Attach File
              </Text>
            </View>

            {/* Attachment options */}
            <View className="flex-row px-4 py-6 justify-around">
              <TouchableOpacity
                className="items-center"
                onPress={() => {
                  toggleAttachmentMenu();
                  setTimeout(() => pickMedia(), 300);
                }}
              >
                <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-2">
                  <Ionicons name="image" size={hp(3.5)} color="#0084ff" />
                </View>
                <Text className="text-sm text-gray-800">Image/Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center"
                onPress={() => {
                  toggleAttachmentMenu();
                  setTimeout(() => pickDocument(), 300);
                }}
              >
                <View className="w-14 h-14 bg-blue-50 rounded-full items-center justify-center mb-2">
                  <Ionicons
                    name="document-text"
                    size={hp(3.5)}
                    color="#0084ff"
                  />
                </View>
                <Text className="text-sm text-gray-800">Document</Text>
              </TouchableOpacity>
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              className="border-t border-gray-200 p-4"
              onPress={toggleAttachmentMenu}
            >
              <Text className="text-center font-medium text-blue-600">
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  // Update handleMenuPress to only use mobile logic
  const handleMenuPress = () => {
    toggleAttachmentMenu();
  };

  // Handle modal close (back button)
  const handleCloseModal = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  };

  // Scroll to bottom when messages or pendingMessages change
  useEffect(() => {
    if (messageListRef.current && messageListRef.current.scrollToEnd) {
      setTimeout(() => {
        messageListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, pendingMessages]);

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      onRequestClose={handleCloseModal}
      presentationStyle="fullScreen"
    >
      <View className="flex-1 bg-white">
        <ChatRoomHeader
          item={item}
          navigation={null}
          currentUser={user}
          onPress={handleCloseModal}
          inModal={true}
        />
        <View className="h-1 border-b border-neutral-300"></View>
        {/* Use platform-specific attachment menu */}
        {renderAttachmentMenu()}
        {/* Main chat interface */}
        <View className="flex-1 justify-between bg-neutral-00 overflow-visible">
          {/* Message list */}
          <View className="flex-1">
            {/* Message list (including system-indicator) */}
            <MessageList
              ref={messageListRef}
              messages={[...messages, ...pendingMessages]}
              currentUser={user}
              autoLoadOlderMessages={true}
              onLoadOlderMessages={() => {}}
            />
          </View>
          {/* Upload progress indicator */}
          {isUploading && (
            <View className="bg-blue-50 px-4 py-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#0084ff" />
                <Text className="ml-2 text-blue-600">
                  Uploading file... {uploadProgress.toFixed(0)}%
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  cancelActiveUpload();
                  setIsUploading(false);
                }}
                className="bg-red-100 rounded-full p-1"
              >
                <AntDesign name="close" size={hp(2)} color="red" />
              </TouchableOpacity>
            </View>
          )}
          {/* Message input area */}
          <View className="pt-2 pb-2 bg-white border-t border-gray-200">
            <View className="flex-row items-center mx-2 my-1">
              {/* Menu button - updated with proper positioning for web dropdown */}
              <View className="relative">
                <TouchableOpacity
                  onPress={handleMenuPress}
                  className="p-2 bg-blue-50 rounded-full"
                >
                  <Ionicons name="attach" size={hp(2.4)} color="#0084ff" />
                </TouchableOpacity>
              </View>
              {/* Text input + send button */}
              <View
                className="flex-row flex-1 bg-gray-100 px-3 rounded-full ml-1"
                style={{
                  alignItems: "center",
                  minHeight: hp(5),
                }}
              >
                <TextInput
                  ref={inputRef}
                  placeholder="Type a message..."
                  className="flex-1 py-2 text-base text-neutral-800"
                  multiline
                  value={inputValue}
                  onChangeText={(value) => {
                    textRef.current = value;
                    setInputValue(value);
                  }}
                  style={{
                    fontSize: hp(2),
                    minHeight: hp(4.5),
                    maxHeight: hp(10),
                    height: inputHeight,
                    paddingVertical: 8,
                  }}
                />
                <TouchableOpacity onPress={handleSendMessage} className="p-2">
                  <Ionicons name="send" size={hp(2.4)} color="#0084ff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
