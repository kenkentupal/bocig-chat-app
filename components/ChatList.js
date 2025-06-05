import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState, useRef } from "react";
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
  // Add refs for caching
  const cacheRef = useRef({
    users: [],
    currentUser: null,
    latestMessages: {},
    unreadMessages: {},
  });

  useEffect(() => {
    // Show cached data immediately if available
    if (
      JSON.stringify(cacheRef.current.users) === JSON.stringify(users) &&
      JSON.stringify(cacheRef.current.currentUser) ===
        JSON.stringify(currentUser)
    ) {
      setLatestMessages(cacheRef.current.latestMessages);
      setUnreadMessages(cacheRef.current.unreadMessages);
    }

    if (!currentUser || users.length === 0) return;

    // Clean up previous listeners
    let unsubscribes = [];

    users.forEach((user) => {
      const me = Array.isArray(currentUser) ? currentUser[0] : currentUser;
      if (!me?.uid || !user?.uid) return;

      // Use correct roomId for group chats
      const roomId = user.isGroup
        ? user.roomId || user.uid
        : getRoomId(me.uid, user.uid);
      const q = query(
        collection(doc(db, "rooms", roomId), "messages"),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const unsub = onSnapshot(q, (snap) => {
        const msg = snap.docs[0]?.data() || null;
        setLatestMessages((prev) => {
          const updated = { ...prev, [user.uid]: msg };
          // Update cache
          cacheRef.current.latestMessages = updated;
          return updated;
        });

        // Check if message is unread (sent by other user and not seen)
        if (msg && msg.senderId !== me.uid && !msg.seen) {
          setUnreadMessages((prev) => {
            const updated = { ...prev, [user.uid]: true };
            cacheRef.current.unreadMessages = updated;
            return updated;
          });
        }
      });

      unsubscribes.push(unsub);
    });

    // Update cache for users and currentUser
    cacheRef.current.users = users;
    cacheRef.current.currentUser = currentUser;

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

  // Sort users and group chats by latest message timestamp (desc)
  const sortedUsers = [...users].sort((a, b) => {
    const aMsg = latestMessages[a.uid];
    const bMsg = latestMessages[b.uid];
    const aTime =
      aMsg?.createdAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const bTime =
      bMsg?.createdAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return (
    <View className="flex-1 w-full px-3">
      <FlatList
        data={sortedUsers}
        contentContainerStyle={{ paddingVertical: 25 }}
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
      />
    </View>
  );
}
