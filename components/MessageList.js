import { ScrollView } from "react-native";
import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, currentUser }) {
  const scrollViewRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      // Delay scroll to ensure content has been rendered
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
      // Scroll to end when content size changes (new messages)
      onContentSizeChange={() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }}
    >
      {messages.map((message, index) => (
        <MessageItem message={message} currentUser={currentUser} key={index} />
      ))}
    </ScrollView>
  );
}
