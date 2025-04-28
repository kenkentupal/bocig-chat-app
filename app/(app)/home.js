import { View, Text, Button, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { StatusBar } from "expo-status-bar";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ChatList from "../../components/ChatList";
import { query, where, getDocs } from "firebase/firestore";
import { usersRef } from "../../firebaseConfig";

export default function home() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      getUsers();
    }
  }, []);

  const getUsers = async () => {
    const q = query(usersRef, where("uid", "!=", user.uid));

    const querySnapshot = await getDocs(q);
    let data = [];
    querySnapshot.forEach((doc) => {
      data.push(doc.data());
    });
    setUsers(data); // Update the state with the fetched data
  };

  return (
    <View className="flex-1 items-center justify-center">
      <StatusBar style="light" />

      {users.length > 0 ? (
        <ChatList currentUser={user} users={users} />
      ) : (
        <View className="flex-1 items-center " style={{ top: hp(30) }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}
