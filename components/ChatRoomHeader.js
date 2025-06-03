import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { db, usersRef } from "../firebaseConfig";
import { getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { serverTimestamp, collection, addDoc } from "firebase/firestore";

export default function ChatRoomHeader({ item, navigation }) {
  const router = useRouter();
  const [showMembersModal, setShowMembersModal] = React.useState(false);
  const [memberDetails, setMemberDetails] = React.useState([]);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [showKickModal, setShowKickModal] = React.useState(false);
  const [showActionMenu, setShowActionMenu] = React.useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = React.useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch group member details when modal opens
  React.useEffect(() => {
    const fetchMembers = async () => {
      if (
        showMembersModal &&
        Array.isArray(item?.users) &&
        item.users.length > 0
      ) {
        try {
          const q = query(usersRef, where("uid", "in", item.users));
          const snap = await getDocs(q);
          const members = snap.docs.map((doc) => doc.data());
          setMemberDetails(members);
        } catch (e) {
          setMemberDetails([]);
        }
      }
    };
    fetchMembers();
  }, [showMembersModal, item]);

  // Fetch all users for add member modal
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (showAddMemberModal) {
        try {
          const q = query(usersRef);
          const snap = await getDocs(q);
          const users = snap.docs.map((doc) => doc.data());
          setAllUsers(users);
        } catch (e) {
          setAllUsers([]);
        }
      }
    };
    fetchAllUsers();
  }, [showAddMemberModal]);

  // Handle back button press with fallbacks for different scenarios
  const handleBackPress = () => {
    // First try the navigation prop if available
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    // If navigation doesn't work or we're on web after refresh,
    // use the router to go to home screen
    router.replace("/home");
  };

  // Remove user from group
  const handleRemoveUser = async (uid) => {
    if (!item?.roomId || !Array.isArray(item?.users)) return;
    try {
      const userToRemove = memberDetails.find((u) => u.uid === uid);
      const updatedUsers = item.users.filter((u) => u !== uid);
      // Firestore v9+ update
      await updateDoc(doc(db, "rooms", item.roomId), { users: updatedUsers });
      // Add system-indicator message for removal
      await addDoc(collection(doc(db, "rooms", item.roomId), "messages"), {
        text: `${userToRemove?.username || userToRemove?.email || userToRemove?.uid} was removed from the group`,
        type: "system-indicator",
        createdAt: serverTimestamp(),
        system: true,
      });
      setMemberDetails((prev) => prev.filter((u) => u.uid !== uid));
      setShowKickModal(false);
      if (item.users) item.users = updatedUsers;
      Alert.alert(
        "User Removed",
        `user: ${userToRemove?.username || userToRemove?.email || userToRemove?.uid} has been removed`,
        [{ text: "OK" }]
      );
    } catch (e) {
      setShowKickModal(false);
      console.log("Failed to remove user from group:", e);
      Alert.alert(
        "Error",
        "Failed to remove user from group. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  // Handler for adding new members
  const handleAddMember = async (selectedUserIds) => {
    if (!item?.roomId) return;
    try {
      // Merge current users with new selected users, avoiding duplicates
      const updatedUsers = Array.from(
        new Set([...(item.users || []), ...selectedUserIds])
      );
      await updateDoc(doc(db, "rooms", item.roomId), { users: updatedUsers });
      // Add system-indicator message for each added user
      for (const uid of selectedUserIds) {
        const addedUser = allUsers.find((u) => u.uid === uid);
        await addDoc(collection(doc(db, "rooms", item.roomId), "messages"), {
          text: `${addedUser?.username || addedUser?.email || addedUser?.uid} was added to the group`,
          type: "system-indicator",
          createdAt: serverTimestamp(),
          system: true,
        });
      }
      setShowAddMemberModal(false);
      // Optionally, refresh memberDetails here
    } catch (e) {
      setShowAddMemberModal(false);
      Alert.alert("Error", "Failed to add member(s). Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Render group members modal
  const renderMembersModal = () => (
    <Modal
      visible={showMembersModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMembersModal(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            minWidth: 260,
            maxWidth: 320,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
            }}
          >
            Group Members
          </Text>
          {memberDetails.length > 0 ? (
            memberDetails.map((user) => (
              <View
                key={user.uid}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Image
                  source={{ uri: user.profileUrl }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    marginRight: 10,
                    backgroundColor: "#e0e7ff",
                  }}
                />
                <Text style={{ fontSize: 16, flex: 1 }}>
                  {user.username || user.email || user.uid}
                </Text>
                {/* Dot button for kick/remove, hide for self */}
                {user.uid !== item.currentUserId && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedMember(user);
                      setShowKickModal(true);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#888" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: "#888", fontSize: 15 }}>
              No members found.
            </Text>
          )}
          {/* Kick/Remove modal */}
          <Modal
            visible={showKickModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowKickModal(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  minWidth: 220,
                }}
              >
                <Text
                  style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}
                >
                  Remove user from group?
                </Text>
                <Text style={{ marginBottom: 18 }}>
                  {selectedMember?.username ||
                    selectedMember?.email ||
                    selectedMember?.uid}
                </Text>
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  <TouchableOpacity
                    onPress={() => setShowKickModal(false)}
                    style={{ marginRight: 18 }}
                  >
                    <Text style={{ color: "#888", fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveUser(selectedMember.uid)}
                  >
                    <Text style={{ color: "#e11d48", fontWeight: "bold" }}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          <TouchableOpacity
            onPress={() => setShowMembersModal(false)}
            style={{
              marginTop: 18,
              alignSelf: "flex-end",
            }}
          >
            <Text
              style={{
                color: "#6366f1",
                fontWeight: "bold",
                fontSize: 16,
              }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={{
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <View className="bg-white pt-3 pb-3">
        <View className="flex-row items-center mx-4">
          {/* Back button with enhanced handling */}
          <TouchableOpacity
            onPress={handleBackPress}
            className="p-2 mr-2"
            style={{ marginLeft: -8 }}
          >
            <Ionicons name="chevron-back" size={hp(3.5)} color="#000" />
          </TouchableOpacity>

          {/* Avatar */}
          {item?.isGroup ? (
            item?.groupAvatar ? (
              <Image
                source={{ uri: item.groupAvatar }}
                style={{ height: hp(5), width: hp(5) }}
                className="rounded-full bg-neutral-200"
              />
            ) : (
              <View
                style={{
                  height: hp(5),
                  width: hp(5),
                  borderRadius: 100,
                  backgroundColor: "#e0e7ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#6366f1",
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                >
                  {item.groupName?.[0] || "G"}
                </Text>
              </View>
            )
          ) : (
            item?.profileUrl && (
              <Image
                source={{ uri: item.profileUrl }}
                style={{ height: hp(5), width: hp(5) }}
                className="rounded-full bg-neutral-200"
              />
            )
          )}

          {/* User info */}
          <View className="ml-3 flex-1">
            <Text className="text-neutral-800 font-bold text-lg">
              {item?.isGroup ? item.groupName : item?.username || "Chat"}
            </Text>
          </View>

          {/* 3-dot menu for group chats */}
          {item?.isGroup && (
            <TouchableOpacity
              onPress={() => setShowActionMenu(true)}
              style={{ padding: 8, marginLeft: 8 }}
            >
              <Ionicons name="ellipsis-vertical" size={hp(3)} color="#222" />
            </TouchableOpacity>
          )}
        </View>
        {/* Action menu for group chat options */}
        {showActionMenu && (
          <Modal
            visible={showActionMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowActionMenu(false)}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
              activeOpacity={1}
              onPressOut={() => setShowActionMenu(false)}
            >
              <View
                style={{
                  position: "absolute",
                  top: Platform.OS === "android" ? 60 : 80,
                  right: 20,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingVertical: 8,
                  minWidth: 160,
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowActionMenu(false);
                    setShowMembersModal(true);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 18 }}
                >
                  <Text style={{ fontSize: 16, color: "#222" }}>
                    See Members
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowActionMenu(false);
                    setShowAddMemberModal(true);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 18 }}
                >
                  <Text style={{ fontSize: 16, color: "#222" }}>
                    Add Member
                  </Text>
                </TouchableOpacity>
                {/* Add more options here in the future */}
              </View>
            </TouchableOpacity>
          </Modal>
        )}
        {/* Add Member Modal with search and add UI */}
        {showAddMemberModal && (
          <Modal
            visible={showAddMemberModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAddMemberModal(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.3)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  minWidth: 260,
                  maxWidth: 340,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    marginBottom: 12,
                  }}
                >
                  Add Member
                </Text>
                <View style={{ marginBottom: 12 }}>
                  <TextInput
                    placeholder="Search users..."
                    value={searchUser}
                    onChangeText={setSearchUser}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 8,
                      padding: 8,
                      fontSize: 15,
                    }}
                  />
                </View>
                <View style={{ maxHeight: 220 }}>
                  {allUsers
                    .filter(
                      (u) =>
                        !item.users.includes(u.uid) &&
                        (u.username
                          ?.toLowerCase()
                          .includes(searchUser.toLowerCase()) ||
                          u.email
                            ?.toLowerCase()
                            .includes(searchUser.toLowerCase()))
                    )
                    .slice(0, 10)
                    .map((user) => (
                      <View
                        key={user.uid}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Image
                          source={{ uri: user.profileUrl }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            marginRight: 10,
                            backgroundColor: "#e0e7ff",
                          }}
                        />
                        <Text style={{ fontSize: 15, flex: 1 }}>
                          {user.username || user.email || user.uid}
                        </Text>
                        <TouchableOpacity
                          disabled={isAdding}
                          onPress={async () => {
                            setIsAdding(true);
                            await handleAddMember([user.uid]);
                            setIsAdding(false);
                          }}
                          style={{
                            backgroundColor: "#6366f1",
                            borderRadius: 8,
                            paddingVertical: 4,
                            paddingHorizontal: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              fontSize: 14,
                            }}
                          >
                            Add
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  {allUsers.filter(
                    (u) =>
                      !item.users.includes(u.uid) &&
                      (u.username
                        ?.toLowerCase()
                        .includes(searchUser.toLowerCase()) ||
                        u.email
                          ?.toLowerCase()
                          .includes(searchUser.toLowerCase()))
                  ).length === 0 && (
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 15,
                        textAlign: "center",
                        marginTop: 12,
                      }}
                    >
                      No users found.
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowAddMemberModal(false)}
                  style={{
                    alignSelf: "flex-end",
                    marginTop: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#6366f1",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {item?.isGroup && renderMembersModal()}
      </View>
    </SafeAreaView>
  );
}
