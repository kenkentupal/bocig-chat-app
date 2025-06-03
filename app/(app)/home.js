import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/authContext";
import { StatusBar } from "expo-status-bar";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ChatList from "../../components/ChatList";
import {
  query,
  where,
  getDocs,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, usersRef } from "../../firebaseConfig";
import { AntDesign } from "@expo/vector-icons";
import { getRoomId } from "../../utils/common";
import SearchUsers from "./search";

export default function home() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [chatUsers, setChatUsers] = useState([]); // users with chatrooms
  const [showUserModal, setShowUserModal] = useState(false);
  // Add cache ref for chatUsers
  const chatUsersCache = useRef({ userId: null, data: [] });

  // Add handler for back button in SearchUsers
  const handleSearchBack = () => setShowUserModal(false);
  // Add handler for new group button (placeholder)
  const handleNewGroup = () => {
    // You can open a group creation modal here
    alert("New Group or Community feature coming soon!");
  };

  useEffect(() => {
    if (user?.uid) {
      // Use cache if user is the same
      if (
        chatUsersCache.current.userId === user.uid &&
        chatUsersCache.current.data.length > 0
      ) {
        setChatUsers(chatUsersCache.current.data);
        // Fetch in background to update cache
        fetchChatUsers(true);
      } else {
        fetchChatUsers();
      }
    }
  }, [user]);

  // Fetch users with whom the current user has a chatroom
  const fetchChatUsers = async (background = false) => {
    const roomsQ = query(
      collection(db, "rooms"),
      where("users", "array-contains", user.uid)
    );
    const roomsSnap = await getDocs(roomsQ);
    const chatUserIds = new Set();
    roomsSnap.forEach((doc) => {
      const usersArr = doc.data().users || [];
      usersArr.forEach((uid) => {
        if (uid !== user.uid) chatUserIds.add(uid);
      });
    });
    if (chatUserIds.size > 0) {
      // Fetch user data for these ids
      const q = query(usersRef, where("uid", "in", Array.from(chatUserIds)));
      const querySnapshot = await getDocs(q);
      let data = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data());
      });
      // Update cache
      chatUsersCache.current = { userId: user.uid, data };
      if (!background) setChatUsers(data);
      if (background && JSON.stringify(data) !== JSON.stringify(chatUsers))
        setChatUsers(data);
    } else {
      chatUsersCache.current = { userId: user.uid, data: [] };
      setChatUsers([]);
    }
  };

  // Open user search modal
  const handleOpenUserModal = () => {
    setShowUserModal(true);
  };

  // Start chat with selected user
  const handleStartChat = async (selectedUser) => {
    const roomId = getRoomId(user.uid, selectedUser.uid);
    await setDoc(
      doc(db, "rooms", roomId),
      {
        roomId,
        users: [user.uid, selectedUser.uid],
        lastMessage: null,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    setShowUserModal(false);
    // Optionally, refresh chatUsers
    fetchChatUsers();
    // Navigate to chatRoom (set selectedChatUser in context if needed)
    // ... navigation logic here ...
  };

  return (
    <View className="flex-1 items-center justify-center">
      <ChatList currentUser={user} users={chatUsers} />

      {/* Floating + button at lower right */}
      <TouchableOpacity
        onPress={handleOpenUserModal}
        style={{
          position: "absolute",
          right: wp(4),
          bottom: hp(4),
          backgroundColor: "#6366f1",
          borderRadius: 100,
          width: hp(7),
          height: hp(7),
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
        }}
        activeOpacity={0.8}
      >
        <AntDesign name="plus" size={hp(3.5)} color="#fff" />
      </TouchableOpacity>
      {/* User search modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-transparent w-full h-full justify-end">
            <SearchUsers
              currentUser={user}
              onUserSelect={handleStartChat}
              onBack={handleSearchBack}
              onNewGroup={handleNewGroup}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
