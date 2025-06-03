import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  BackHandler,
} from "react-native";
import { usersRef } from "../../firebaseConfig";
import { query, where, getDocs } from "firebase/firestore";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useChat } from "../../context/chatContext";
import { useRouter } from "expo-router";

// Props: currentUser, onUserSelect
export default function SearchUsers({
  currentUser,
  onUserSelect,
  onBack,
  onNewGroup,
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const [groupSearch, setGroupSearch] = useState("");
  const { setSelectedChatUser } = useChat();
  const router = useRouter();

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const onHardwareBack = () => {
      if (showSearch) {
        setShowSearch(false);
        setSearch("");
        return true;
      } else if (onBack) {
        onBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBack
    );
    return () => {
      subscription.remove();
    };
  }, [showSearch, onBack]);

  const fetchAllUsers = async () => {
    const q = query(usersRef, where("uid", "!=", currentUser.uid));
    const querySnapshot = await getDocs(q);
    let data = [];
    querySnapshot.forEach((doc) => {
      data.push(doc.data());
    });
    setAllUsers(data);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  // Only contacts, no recents
  const contacts = filteredUsers;

  // Handler for creating a new group chat
  const handleCreateGroupChat = () => {
    setShowGroupModal(true);
  };

  // Toggle user selection for group
  const toggleUserInGroup = (uid) => {
    setSelectedGroupUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Confirm group creation
  const confirmGroupCreation = () => {
    if (selectedGroupUsers.length < 2) {
      alert("Select at least 2 users for a group chat.");
      return;
    }
    // Add current user to the group
    const groupMembers = [currentUser.uid, ...selectedGroupUsers];
    // Generate a random group ID
    const groupId = `group_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    // Set selected chat user/group in context (for now, as a group object)
    setSelectedChatUser({
      isGroup: true,
      users: groupMembers, // <-- keep as array
      usernames: groupMembers.map((uid) => {
        const u =
          allUsers.find((user) => user.uid === uid) ||
          (uid === currentUser.uid ? currentUser : null);
        return u ? u.username : uid;
      }),
      groupName: `Group Chat`,
      groupAvatar: null, // You can add group avatar logic
      uid: groupId, // Use random group id
    });
    setShowGroupModal(false);
    setSelectedGroupUsers([]);
    setGroupSearch("");
    // Navigate to chatRoom
    router.push("/chatRoom");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", borderRadius: 16 }}>
      {/* Header or Search Bar */}
      {showSearch ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowSearch(false);
              setSearch("");
            }}
            style={{ marginRight: 16 }}
          >
            <AntDesign name="arrowleft" size={26} color="#6366f1" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search by username"
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              fontSize: 16,
              color: "#222",
              backgroundColor: "transparent",
            }}
            placeholderTextColor="#94a3b8"
            autoFocus
          />
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity onPress={onBack} style={{ marginRight: 16 }}>
            <AntDesign name="arrowleft" size={26} color="#6366f1" />
          </TouchableOpacity>
          <Text
            style={{ flex: 1, color: "#222", fontWeight: "bold", fontSize: 20 }}
          >
            New chat
          </Text>
          <TouchableOpacity onPress={() => setShowSearch(true)}>
            <AntDesign name="search1" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>
      )}
      {/* New Group/Community */}
      <TouchableOpacity
        onPress={handleCreateGroupChat}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "#f9fafb",
          borderBottomWidth: 1,
          borderColor: "#e5e7eb",
        }}
      >
        <MaterialIcons
          name="group"
          size={28}
          color="#6366f1"
          style={{ marginRight: 16 }}
        />
        <Text style={{ color: "#222", fontSize: 16, fontWeight: "500" }}>
          New Group Chat
        </Text>
      </TouchableOpacity>
      {/* Group creation modal */}
      <Modal visible={showGroupModal} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "#0008",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              width: "90%",
              maxHeight: 400,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Select users for group chat
            </Text>
            <TextInput
              placeholder="Search users..."
              value={groupSearch}
              onChangeText={setGroupSearch}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginBottom: 10,
                fontSize: 15,
              }}
              placeholderTextColor="#94a3b8"
            />
            <ScrollView style={{ maxHeight: 250 }}>
              {allUsers
                .filter((u) =>
                  u.username?.toLowerCase().includes(groupSearch.toLowerCase())
                )
                .map((u) => (
                  <TouchableOpacity
                    key={u.uid}
                    onPress={() => toggleUserInGroup(u.uid)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: selectedGroupUsers.includes(u.uid)
                          ? "#6366f1"
                          : "#e5e7eb",
                        backgroundColor: selectedGroupUsers.includes(u.uid)
                          ? "#6366f1"
                          : "#fff",
                        marginRight: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selectedGroupUsers.includes(u.uid) && (
                        <AntDesign name="check" size={16} color="#fff" />
                      )}
                    </View>
                    <Image
                      source={{ uri: u.profileUrl }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        marginRight: 10,
                        backgroundColor: "#e5e7eb",
                      }}
                    />
                    <Text style={{ fontSize: 16 }}>{u.username}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowGroupModal(false)}
                style={{ marginRight: 18 }}
              >
                <Text style={{ color: "#64748b", fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmGroupCreation}
                style={{
                  backgroundColor: "#6366f1",
                  borderRadius: 8,
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Create Group
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View
        style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 }}
      />
      {/* CONTACTS section - only show if searching and search is not empty */}
      {showSearch && search.trim().length > 0 && (
        <>
          <Text
            style={{
              color: "#6366f1",
              fontSize: 13,
              marginLeft: 16,
              marginBottom: 4,
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            CONTACTS
          </Text>
          <ScrollView
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
          >
            {contacts.length > 0 ? (
              contacts.map((u) => (
                <TouchableOpacity
                  key={u.uid}
                  onPress={() => {
                    setSelectedChatUser(u);
                    setShowSearch(false);
                    setSearch("");
                    router.push("/chatRoom");
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderColor: "#f1f5f9",
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{ width: 32, alignItems: "center", marginRight: 8 }}
                  >
                    <Text
                      style={{
                        color: "#6366f1",
                        fontWeight: "bold",
                        fontSize: 18,
                      }}
                    >
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                  <Image
                    source={{ uri: u.profileUrl }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      marginRight: 14,
                      backgroundColor: "#e5e7eb",
                      borderWidth: 2,
                      borderColor: "#e0e7ff",
                    }}
                  />
                  <Text
                    style={{ color: "#222", fontSize: 17, fontWeight: "500" }}
                  >
                    {u.username}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text
                style={{
                  color: "#64748b",
                  textAlign: "center",
                  marginTop: 32,
                  fontSize: 16,
                }}
              >
                No users found
              </Text>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}
