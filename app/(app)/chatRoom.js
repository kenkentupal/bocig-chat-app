import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useChat } from "../../context/chatContext";
import { useAuth } from "../../context/authContext";
import ChatRoomHeader from "../../components/ChatRoomHeader";
import MessageList from "../../components/MessageList";
import MenuOptions from "../../components/MenuOptions";
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

export default function ChatRoom() {
  // Hooks
  const router = useRouter();
  const { selectedChatUser: item } = useChat();
  const { user } = useAuth();

  // State
  const [inputValue, setInputValue] = useState("");
  const [inputHeight, setInputHeight] = useState(hp(5.5));
  const [messages, setMessages] = useState([]);

  // State for menu and keyboard
  const [menuVisible, setMenuVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(300);

  // Refs
  const textRef = useRef("");
  const inputRef = useRef(null);

  // Listen for keyboard events to get height
  useEffect(() => {
    const onKeyboardShow = (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setMenuVisible(false); // Hide menu if keyboard opens
    };
    const onKeyboardHide = () => {
      // Optionally do nothing or keep menuVisible as is
    };
    const showSub = Keyboard.addListener("keyboardDidShow", onKeyboardShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onKeyboardHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleMenuPress = () => {
    Keyboard.dismiss(); // Hide keyboard before showing menu
    setTimeout(() => setMenuVisible((v) => !v), 100); // Toggle menu after keyboard hides
  };

  const handleOptionPress = (optionKey) => {
    setMenuVisible(false);
    // TODO: handle each option (camera, gallery, etc)
    Alert.alert(optionKey, `You pressed ${optionKey}`);
  };

  // Create a chat room if it doesn't exist
  const createRoomIfNotExists = async () => {
    let roomId = getRoomId(user?.uid, item?.uid);
    await setDoc(
      doc(db, "rooms", roomId),
      {
        roomId,
        users: [user.uid, item.uid],
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
      let roomId = getRoomId(user?.uid, item?.uid);
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
    let message = textRef.current.trim();
    if (!message) return;

    try {
      let roomId = getRoomId(user?.uid, item?.uid);
      const docRef = doc(db, "rooms", roomId);
      const messageRef = collection(docRef, "messages");

      // Add message to Firestore
      await addDoc(messageRef, {
        senderId: user?.uid,
        receiverId: item?.uid,
        text: message,
        profileUrl: user?.profileUrl,
        senderName: user?.username,
        createdAt: serverTimestamp(),
        seen: false,
      });

      // Clear input
      setInputValue("");
      textRef.current = "";
    } catch (error) {
      Alert.alert("Error sending message: ", error);
    }
  };

  // Listen for messages and mark as seen
  useEffect(() => {
    if (!user?.uid || !item?.uid) return;

    createRoomIfNotExists();

    // Set up listener for messages
    let roomId = getRoomId(user?.uid, item?.uid);
    const docRef = doc(db, "rooms", roomId);
    const messageRef = collection(docRef, "messages");
    const q = query(messageRef, orderBy("createdAt", "asc"));

    let unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Update messages state
      let messages = querySnapshot.docs.map((doc) => {
        return { id: doc.id, ...doc.data() };
      });
      setMessages(messages);

      // Mark messages as seen when loaded
      markMessagesAsSeen();
    });

    return () => unsubscribe();
  }, [item, user]);

  return (
    <>
      <Stack.Screen
        options={{
          header: ({ navigation }) => (
            <>
              <ChatRoomHeader item={item} navigation={navigation} />
              <View className="h-1 border-b border-neutral-300"></View>
            </>
          ),
          headerShadowVisible: false,
        }}
      />
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 justify-between bg-neutral-00 overflow-visible">
          {/* Message list */}
          <View className="flex-1">
            <MessageList messages={messages} currentUser={user} />
          </View>

          {/* MenuOptions overlay above input */}
          {menuVisible && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: hp(8.5), // adjust to match input area height
                zIndex: 99,
              }}
              pointerEvents="box-none"
            >
              <MenuOptions
                keyboardHeight={keyboardHeight}
                onOptionPress={handleOptionPress}
                onClose={() => setMenuVisible(false)}
              />
            </View>
          )}

          {/* Simplified message input area - single row */}
          <View className="pt-2 pb-2 bg-white border-t border-gray-200">
            <View className="flex-row items-center mx-2 my-1">
              {/* Menu button */}
              <TouchableOpacity onPress={handleMenuPress} className="p-2">
                <AntDesign name="pluscircle" size={hp(2.2)} color="#0084ff" />
              </TouchableOpacity>

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
    </>
  );
}
