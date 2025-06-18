import React, { createContext, useState, useContext, useEffect } from "react";
import { Platform } from "react-native";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  // Load saved user when context is created (for web reloads)
  useEffect(() => {
    if (Platform.OS === "web" && window.localStorage) {
      const savedUser = window.localStorage.getItem("selectedChatUser");
      if (savedUser) {
        try {
          setSelectedChatUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing saved user:", e);
        }
      }
    }
  }, []);

  // Save selected user whenever it changes
  useEffect(() => {
    if (selectedChatUser && Platform.OS === "web" && window.localStorage) {
      window.localStorage.setItem(
        "selectedChatUser",
        JSON.stringify(selectedChatUser)
      );
    }
  }, [selectedChatUser]);

  return (
    <ChatContext.Provider
      value={{ selectedChatUser, setSelectedChatUser }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
