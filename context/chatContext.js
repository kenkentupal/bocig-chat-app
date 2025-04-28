import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [selectedChatUser, setSelectedChatUserState] = useState(null);

  // Load persisted chat user on mount
  useEffect(() => {
    const loadChatUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("selectedChatUser");
        if (stored) setSelectedChatUserState(JSON.parse(stored));
      } catch (e) {
        // handle error if needed
      }
    };
    loadChatUser();
  }, []);

  // Persist chat user on change
  const setSelectedChatUser = async (user) => {
    setSelectedChatUserState(user);
    if (user) {
      await AsyncStorage.setItem("selectedChatUser", JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem("selectedChatUser");
    }
  };

  return (
    <ChatContext.Provider value={{ selectedChatUser, setSelectedChatUser }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
