import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import ChatItem from "./ChatItem";
import { useRouter } from "expo-router";
import { db } from "../firebaseConfig";
import { getRoomId } from "../utils/common";
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

export default function ChatList({ users, currentUser }) {
  const router = useRouter();
  const [latestMessages, setLatestMessages] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    if (!currentUser || users.length === 0) return;

    // Clean up previous listeners
    let unsubscribes = [];

    users.forEach((user) => {
      const me = Array.isArray(currentUser) ? currentUser[0] : currentUser;
      if (!me?.uid || !user?.uid) return;

      const roomId = getRoomId(me.uid, user.uid);
      const q = query(
        collection(doc(db, "rooms", roomId), "messages"),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const unsub = onSnapshot(q, (snap) => {
        const msg = snap.docs[0]?.data() || null;
        setLatestMessages((prev) => ({
          ...prev,
          [user.uid]: msg,
        }));

        // Check if message is unread (sent by other user and not seen)
        if (msg && msg.senderId !== me.uid && !msg.seen) {
          setUnreadMessages((prev) => ({
            ...prev,
            [user.uid]: true,
          }));
        }
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub && unsub());
    };
  }, [users, currentUser]);

  // Mark messages as read when user opens a chat
  const handleChatOpen = (userId) => {
    setUnreadMessages((prev) => ({
      ...prev,
      [userId]: false,
    }));

    // Navigate to the chat screen
    const me = Array.isArray(currentUser) ? currentUser[0] : currentUser;
    if (me?.uid) {
      router.push({
        pathname: `/chat/${userId}`,
        params: { currentUserId: me.uid },
      });
    }
  };

  // Sort users by latest message timestamp (desc)
  const sortedUsers = [...users].sort((a, b) => {
    const aMsg = latestMessages[a.uid];
    const bMsg = latestMessages[b.uid];
    const aTime = aMsg?.createdAt?.toMillis?.() || 0;
    const bTime = bMsg?.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return (
    <View className="flex-1 w-full px-3">
      <FlatList
        data={sortedUsers}
        contentContainerStyle={{ flex: 1, paddingVertical: 25 }}
        keyExtractor={(item) => item.uid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ChatItem
            noBorder={index + 1 == sortedUsers.length}
            item={item}
            index={index}
            router={router}
            currentUser={currentUser}
            lastMsg={latestMessages[item.uid] || null}
            hasUnread={unreadMessages[item.uid] || false}
            onPress={() => handleChatOpen(item.uid)}
          />
        )}
        ListEmptyComponent={<Text>No chats available</Text>}
      />
    </View>
  );
}
