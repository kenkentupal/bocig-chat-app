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
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { db, usersRef } from "../firebaseConfig";
import {
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { serverTimestamp, collection, addDoc } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function ChatRoomHeader({
  item,
  navigation,
  currentUser,
  onPress,
  inModal,
}) {
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
  const [isRemoving, setIsRemoving] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = React.useState(false);
  const [editGroupName, setEditGroupName] = useState(item?.groupName || "");
  const [editGroupAvatar, setEditGroupAvatar] = useState(
    item?.groupAvatar || null
  );
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  // Add loading states
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  // Add state for selecting users to add
  const [selectedAddUsers, setSelectedAddUsers] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  // Add loading state for image upload
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Add state for real-time group data
  const [groupData, setGroupData] = useState(item);

  // Listen for real-time updates to group (room) document
  useEffect(() => {
    if (item?.isGroup && item?.roomId) {
      const unsub = onSnapshot(doc(db, "rooms", item.roomId), (docSnap) => {
        if (docSnap.exists()) {
          setGroupData({ ...docSnap.data(), roomId: item.roomId });
        }
      });
      return () => unsub();
    } else {
      setGroupData(item);
    }
  }, [item?.roomId, item?.isGroup]);

  // Fetch group member details when modal opens
  React.useEffect(() => {
    const fetchMembers = async () => {
      if (
        showMembersModal &&
        Array.isArray(groupData?.users) &&
        groupData.users.length > 0
      ) {
        setLoadingMembers(true);
        try {
          const q = query(usersRef, where("uid", "in", groupData.users));
          const snap = await getDocs(q);
          const members = snap.docs.map((doc) => doc.data());
          setMemberDetails(members);
        } catch (e) {
          setMemberDetails([]);
        }
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, [showMembersModal, groupData]);

  // Fetch all users for add member modal
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (showAddMemberModal) {
        setLoadingAllUsers(true);
        try {
          const q = query(usersRef);
          const snap = await getDocs(q);
          const users = snap.docs.map((doc) => doc.data());
          setAllUsers(users);
        } catch (e) {
          setAllUsers([]);
        }
        setLoadingAllUsers(false);
      }
    };
    fetchAllUsers();
  }, [showAddMemberModal]);

  // Sync local edit state with item prop changes (for real-time updates)
  useEffect(() => {
    setEditGroupName(item?.groupName || "");
    setEditGroupAvatar(item?.groupAvatar || null);
  }, [item?.groupName, item?.groupAvatar]);

  // Handle back button press with fallbacks for different scenarios
  const handleBackPress = () => {
    if (onPress) {
      onPress();
      return;
    }
    // First try the navigation prop if available
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // If navigation doesn't work or we're on web after refresh,
    // use the router to go to home screen
    // router.replace("/home");
  };

  // Remove user from group
  const handleRemoveUser = async (uid) => {
    if (!item?.roomId || !Array.isArray(item?.users)) return;
    setIsRemoving(true);
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
    } catch (e) {
      setShowKickModal(false);
      console.log("Failed to remove user from group:", e);
      Alert.alert(
        "Error",
        "Failed to remove user from group. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsRemoving(false);
    }
  };

  // Handler for adding new members
  const handleAddMember = async (selectedUserIds) => {
    if (!groupData?.roomId) return;
    setIsAdding(true);
    try {
      // Merge current users with new selected users, avoiding duplicates
      const updatedUsers = Array.from(
        new Set([...(groupData.users || []), ...selectedUserIds])
      );
      await updateDoc(doc(db, "rooms", groupData.roomId), {
        users: updatedUsers,
      });
      // Add system-indicator message for each added user
      for (const uid of selectedUserIds) {
        const addedUser = allUsers.find((u) => u.uid === uid);
        await addDoc(
          collection(doc(db, "rooms", groupData.roomId), "messages"),
          {
            text: `${addedUser?.username || addedUser?.email || addedUser?.uid} was added to the group`,
            type: "system-indicator",
            createdAt: serverTimestamp(),
            system: true,
          }
        );
      }
      setShowAddMemberModal(false);
      // Refresh memberDetails if members modal is open
      if (showMembersModal) {
        const q = query(usersRef, where("uid", "in", [...updatedUsers]));
        const snap = await getDocs(q);
        const members = snap.docs.map((doc) => doc.data());
        setMemberDetails(members);
      }
      setAllUsers((prev) => [...prev]);
    } catch (e) {
      setShowAddMemberModal(false);
      Alert.alert("Error", "Failed to add member(s). Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsAdding(false);
    }
  };

  // Image picker helper (expo-image-picker)
  const pickImage = async () => {
    let result;
    try {
      const ImagePicker = await import("expo-image-picker");
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditGroupAvatar(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  // Helper to upload image to Firebase Storage and get URL
  async function uploadImageToStorage(uri, groupId) {
    try {
      setIsUploadingImage(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const fileName = `groupAvatars/${groupId}_${Date.now()}`;
      const ref = storageRef(storage, fileName);
      await uploadBytes(ref, blob);
      const url = await getDownloadURL(ref);
      setIsUploadingImage(false);
      return url;
    } catch (e) {
      setIsUploadingImage(false);
      Alert.alert("Upload failed", e.message || "Could not upload image");
      throw e;
    }
  }

  // Save group changes
  const handleSaveGroupEdit = async () => {
    if (!groupData?.roomId) return;
    setIsUpdatingGroup(true);
    let oldAvatarUrl = groupData.groupAvatar;
    try {
      let avatarUrl = editGroupAvatar;
      let changes = [];
      if (editGroupName !== groupData.groupName) changes.push("name");
      if (editGroupAvatar !== groupData.groupAvatar) changes.push("picture");
      // If avatar is a new local uri, upload to storage
      if (editGroupAvatar && editGroupAvatar.startsWith("file://")) {
        avatarUrl = await uploadImageToStorage(
          editGroupAvatar,
          groupData.roomId
        );
        if (!avatarUrl.startsWith("http")) {
          Alert.alert("Upload failed", "Image URL is invalid: " + avatarUrl);
          setIsUpdatingGroup(false);
          return;
        }
      }
      await updateDoc(doc(db, "rooms", groupData.roomId), {
        groupName: editGroupName,
        groupAvatar: avatarUrl,
      });
      // Delete old avatar from storage if changed and is a Firebase Storage URL
      if (
        oldAvatarUrl &&
        oldAvatarUrl !== avatarUrl &&
        oldAvatarUrl.includes("firebasestorage.googleapis.com")
      ) {
        try {
          const storage = getStorage();
          // Extract the path from the URL
          const matches = oldAvatarUrl.match(/\/o\/(.+)\?/);
          if (matches && matches[1]) {
            const filePath = decodeURIComponent(matches[1]);
            const oldRef = storageRef(storage, filePath);
            await deleteObject(oldRef);
          }
        } catch (e) {
          // Ignore errors for deleting old image
        }
      }
      // Add system-indicator message
      if (changes.length > 0) {
        let changeText = "";
        if (changes.length === 2) {
          changeText = "changed the group name and picture";
        } else if (changes[0] === "name") {
          changeText = "changed the group name";
        } else if (changes[0] === "picture") {
          changeText = "changed the group picture";
        }
        // Use currentUser prop for changer name
        const changer =
          currentUser?.displayName ||
          currentUser?.username ||
          currentUser?.email ||
          "Someone";
        await addDoc(
          collection(doc(db, "rooms", groupData.roomId), "messages"),
          {
            text: `${changer} ${changeText}`,
            type: "system-indicator",
            createdAt: serverTimestamp(),
            system: true,
          }
        );
      }
      setShowEditGroupModal(false);
    } catch (e) {
      Alert.alert("Error", "Failed to update group.");
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  // Render group members modal
  const renderMembersModal = () => {
    const memberCount = memberDetails.length;
    // Calculate modal height: base + per member, with a max
    const baseHeight = 180; // header, padding, buttons
    const perMember = 52; // height per member row
    const maxModalHeight = 420; // max modal height for mobile
    const modalHeight = Math.min(
      baseHeight + memberCount * perMember,
      maxModalHeight
    );

    return (
      <Modal
        visible={showMembersModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.18)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: 28,
              minWidth: 290,
              maxWidth: 370,
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 8,
              position: "relative",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              height: modalHeight,
            }}
          >
            {/* Header with title and + button */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 20,
                  color: "#222",
                  textAlign: "center",
                  flex: 1,
                }}
              >
                Group Members
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMembersModal(false);
                  setShowAddMemberModal(true);
                }}
                style={{ marginLeft: 12, padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={28} color="#6366f1" />
              </TouchableOpacity>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "#e5e7eb",
                marginBottom: 10,
              }}
            />
            {/* Members list with dynamic height */}
            {loadingMembers ? (
              <View style={{ alignItems: "center", marginVertical: 20 }}>
                <Text style={{ color: "#6366f1", fontSize: 16 }}>
                  Loading...
                </Text>
              </View>
            ) : memberDetails.length > 0 ? (
              <ScrollView
                style={{ maxHeight: 220 }}
                contentContainerStyle={{ paddingBottom: 10 }}
                showsVerticalScrollIndicator={memberDetails.length > 5}
              >
                {memberDetails.map((user) => (
                  <View
                    key={user.uid}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                      paddingVertical: 6,
                      borderBottomWidth: 0.5,
                      borderColor: "#f1f5f9",
                      backgroundColor:
                        user.uid === currentUser?.uid ? "#f1f5f9" : "#fff",
                      borderRadius: 8,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Image
                      source={{ uri: user.profileUrl }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        marginRight: 12,
                        backgroundColor: "#e0e7ff",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        flex: 1,
                        color: "#222",
                        fontWeight:
                          user.uid === currentUser?.uid ? "bold" : "normal",
                      }}
                    >
                      {user.username || user.email || user.uid}
                    </Text>
                    {/* Dot button for kick/remove, show 'Leave Group' for self */}
                    {user.uid === currentUser?.uid ? (
                      <TouchableOpacity
                        onPress={() => setShowLeaveModal(true)}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          backgroundColor: "#fef2f2",
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: "#e11d48", fontWeight: "bold" }}>
                          Leave Group
                        </Text>
                      </TouchableOpacity>
                    ) : user.uid !== item.currentUserId ? (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMember(user);
                          setShowKickModal(true);
                        }}
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          backgroundColor: "#fef2f2",
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="remove-circle"
                          size={22}
                          color="#e11d48"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text
                style={{ color: "#888", fontSize: 15, textAlign: "center" }}
              >
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
                    borderRadius: 14,
                    padding: 28,
                    minWidth: 240,
                    shadowColor: "#000",
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 17,
                      marginBottom: 14,
                      color: "#e11d48",
                      textAlign: "center",
                    }}
                  >
                    Remove user from group?
                  </Text>
                  <Text
                    style={{
                      marginBottom: 20,
                      textAlign: "center",
                      color: "#222",
                    }}
                  >
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
                      disabled={isRemoving}
                      style={{
                        backgroundColor: "#fee2e2",
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      {isRemoving ? (
                        <Text style={{ color: "#e11d48", fontWeight: "bold" }}>
                          Removing...
                        </Text>
                      ) : (
                        <Text style={{ color: "#e11d48", fontWeight: "bold" }}>
                          Remove
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            {/* Leave Group modal for self */}
            <Modal
              visible={showLeaveModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowLeaveModal(false)}
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
                    borderRadius: 14,
                    padding: 28,
                    minWidth: 240,
                    shadowColor: "#000",
                    shadowOpacity: 0.18,
                    shadowRadius: 16,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 17,
                      marginBottom: 14,
                      color: "#e11d48",
                      textAlign: "center",
                    }}
                  >
                    Leave group?
                  </Text>
                  <Text
                    style={{
                      marginBottom: 20,
                      textAlign: "center",
                      color: "#222",
                    }}
                  >
                    Are you sure you want to leave this group?
                  </Text>
                  <View
                    style={{ flexDirection: "row", justifyContent: "flex-end" }}
                  >
                    <TouchableOpacity
                      onPress={() => setShowLeaveModal(false)}
                      style={{ marginRight: 18 }}
                    >
                      <Text style={{ color: "#888", fontWeight: "bold" }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        setShowLeaveModal(false);
                        try {
                          const updatedUsers = item.users.filter(
                            (u) => u !== currentUser.uid
                          );
                          await updateDoc(doc(db, "rooms", item.roomId), {
                            users: updatedUsers,
                          });
                          await addDoc(
                            collection(
                              doc(db, "rooms", item.roomId),
                              "messages"
                            ),
                            {
                              text: `${currentUser?.username || currentUser?.email || currentUser?.uid} left the group`,
                              type: "system-indicator",
                              createdAt: serverTimestamp(),
                              system: true,
                            }
                          );
                          if (navigation && navigation.canGoBack()) {
                            navigation.goBack();
                          } else {
                            router.replace("/home");
                          }
                        } catch (e) {
                          Alert.alert("Error", "Failed to leave group.");
                        }
                      }}
                      style={{
                        backgroundColor: "#fee2e2",
                        borderRadius: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ color: "#e11d48", fontWeight: "bold" }}>
                        Leave Group
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <TouchableOpacity
              onPress={() => setShowMembersModal(false)}
              style={{
                marginTop: 22,
                alignSelf: "flex-end",
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: "#6366f1",
                borderRadius: 8,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#fff",
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
  };

  // Add Member Modal UI
  const renderAddMemberModal = () => (
    <Modal
      visible={showAddMemberModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAddMemberModal(false)}
    >
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
            Add members to group
          </Text>
          <TextInput
            placeholder="Search users..."
            value={searchUser}
            onChangeText={setSearchUser}
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
          {isAdding && (
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: "#6366f1", fontSize: 15 }}>
                Adding members...
              </Text>
            </View>
          )}
          <ScrollView style={{ maxHeight: 250 }}>
            {allUsers
              .filter(
                (u) =>
                  !item.users.includes(u.uid) &&
                  (u.username
                    ?.toLowerCase()
                    .includes(searchUser.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchUser.toLowerCase()))
              )
              .map((u) => (
                <TouchableOpacity
                  key={u.uid}
                  onPress={() => {
                    setSelectedAddUsers((prev) =>
                      prev.includes(u.uid)
                        ? prev.filter((id) => id !== u.uid)
                        : [...prev, u.uid]
                    );
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                  disabled={isAdding}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedAddUsers.includes(u.uid)
                        ? "#6366f1"
                        : "#e5e7eb",
                      backgroundColor: selectedAddUsers.includes(u.uid)
                        ? "#6366f1"
                        : "#fff",
                      marginRight: 12,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedAddUsers.includes(u.uid) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
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
                  <Text style={{ fontSize: 16 }}>{u.username || u.email}</Text>
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
              onPress={() => {
                setShowAddMemberModal(false);
                setSelectedAddUsers([]);
                setSearchUser("");
              }}
              style={{ marginRight: 18 }}
              disabled={isAdding}
            >
              <Text style={{ color: "#64748b", fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (selectedAddUsers.length === 0 || isAdding) return;
                await handleAddMember(selectedAddUsers);
                setSelectedAddUsers([]);
                setSearchUser("");
              }}
              style={{
                backgroundColor:
                  selectedAddUsers.length && !isAdding ? "#6366f1" : "#c7d2fe",
                borderRadius: 8,
                paddingHorizontal: 18,
                paddingVertical: 8,
              }}
              disabled={selectedAddUsers.length === 0 || isAdding}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {isAdding ? "Adding..." : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={{
        backgroundColor: "#fff",
        paddingTop: inModal
          ? 0
          : Platform.OS === "android"
            ? StatusBar.currentHeight
            : 0,
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
          {groupData?.isGroup ? (
            groupData?.groupAvatar &&
            groupData.groupAvatar.startsWith("http") ? (
              <Image
                source={{ uri: groupData.groupAvatar }}
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
                  {groupData.groupName?.[0] || "G"}
                </Text>
              </View>
            )
          ) : (
            groupData?.profileUrl && (
              <Image
                source={{ uri: groupData.profileUrl }}
                style={{ height: hp(5), width: hp(5) }}
                className="rounded-full bg-neutral-200"
              />
            )
          )}

          {/* User info */}
          <View className="ml-3 flex-1">
            <Text className="text-neutral-800 font-bold text-lg">
              {groupData?.isGroup
                ? groupData.groupName
                : groupData?.username || "Chat"}
            </Text>
          </View>

          {/* 3-dot menu for group chats */}
          {groupData?.isGroup && (
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
                {/* Removed Add Member from here */}
                <TouchableOpacity
                  onPress={() => {
                    setShowActionMenu(false);
                    setShowEditGroupModal(true);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 18 }}
                >
                  <Text style={{ fontSize: 16, color: "#222" }}>
                    Edit Group
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        )}
        {/* Edit Group Modal */}
        {showEditGroupModal && (
          <Modal
            visible={showEditGroupModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEditGroupModal(false)}
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
                  borderRadius: 20,
                  padding: 28,
                  minWidth: 280,
                  maxWidth: 370,
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 20,
                    marginBottom: 16,
                    color: "#222",
                    textAlign: "center",
                  }}
                >
                  Edit Group
                </Text>
                <TouchableOpacity
                  onPress={pickImage}
                  style={{ alignSelf: "center", marginBottom: 16 }}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Text
                      style={{
                        color: "#6366f1",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      Uploading...
                    </Text>
                  ) : editGroupAvatar ? (
                    <Image
                      source={{ uri: editGroupAvatar }}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: "#e0e7ff",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: "#e0e7ff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="camera" size={32} color="#6366f1" />
                    </View>
                  )}
                </TouchableOpacity>
                <TextInput
                  placeholder="Group Name"
                  value={editGroupName}
                  onChangeText={setEditGroupName}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 16,
                    backgroundColor: "#f4f4f5",
                    marginBottom: 18,
                  }}
                />
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  <TouchableOpacity
                    onPress={() => setShowEditGroupModal(false)}
                    style={{ marginRight: 18 }}
                  >
                    <Text style={{ color: "#888", fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveGroupEdit}
                    disabled={isUpdatingGroup}
                  >
                    <Text style={{ color: "#6366f1", fontWeight: "bold" }}>
                      {isUpdatingGroup ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
        {groupData?.isGroup && renderMembersModal()}
        {showAddMemberModal && renderAddMemberModal()}
      </View>
    </SafeAreaView>
  );
}
