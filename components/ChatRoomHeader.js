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
import MembersModals from "./MembersModals";

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
        {/* Members modals grouped in MembersModals component */}
        {groupData?.isGroup && (
          <MembersModals
            showMembersModal={showMembersModal}
            setShowMembersModal={setShowMembersModal}
            memberDetails={memberDetails}
            loadingMembers={loadingMembers}
            currentUser={currentUser}
            item={{
              ...item,
              updateRoomUsers: async (updatedUsers) => {
                await updateDoc(doc(db, "rooms", item.roomId), {
                  users: updatedUsers,
                });
              },
              addSystemMessage: async (text) => {
                await addDoc(
                  collection(doc(db, "rooms", item.roomId), "messages"),
                  {
                    text,
                    type: "system-indicator",
                    createdAt: serverTimestamp(),
                    system: true,
                  }
                );
              },
            }}
            setShowAddMemberModal={setShowAddMemberModal}
            showKickModal={showKickModal}
            setShowKickModal={setShowKickModal}
            selectedMember={selectedMember}
            setSelectedMember={setSelectedMember}
            handleRemoveUser={handleRemoveUser}
            isRemoving={isRemoving}
            showLeaveModal={showLeaveModal}
            setShowLeaveModal={setShowLeaveModal}
            navigation={navigation}
            router={router}
            setMemberDetails={setMemberDetails}
            setAllUsers={setAllUsers}
          />
        )}
        {showAddMemberModal && renderAddMemberModal()}
      </View>
    </SafeAreaView>
  );
}
