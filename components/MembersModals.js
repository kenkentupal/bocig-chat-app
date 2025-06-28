import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, usersRef } from "../firebaseConfig";
import {
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { AntDesign } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

// --- Add Member Modal ---
function AddMemberModal({
  visible,
  onClose,
  allUsers,
  groupUsers,
  isAdding,
  selectedAddUsers,
  setSelectedAddUsers,
  searchUser,
  setSearchUser,
  handleAddMember,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            <View
              style={{
                alignItems: "center",
                marginBottom: 10,
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator
                size="small"
                color="#6366f1"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#6366f1", fontSize: 15 }}>
                Adding members...
              </Text>
            </View>
          )}
          <ScrollView style={{ maxHeight: 250 }}>
            {allUsers
              .filter(
                (u) =>
                  !groupUsers.includes(u.uid) &&
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
              marginBottom: 18, // Add equal space below Add Member button
            }}
          >
            <TouchableOpacity
              onPress={() => {
                onClose();
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
              }}
              style={{
                backgroundColor:
                  selectedAddUsers.length && !isAdding ? "#6366f1" : "#c7d2fe",
                borderRadius: 8,
                paddingHorizontal: 18,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                minWidth: 80,
                justifyContent: "center",
              }}
              disabled={selectedAddUsers.length === 0 || isAdding}
            >
              {isAdding && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                {isAdding ? "Adding..." : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Kick Member Modal ---
function KickMemberModal({ visible, onClose, member, onRemove, isRemoving }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            width: "80%",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Remove member
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Are you sure you want to remove{" "}
            <Text style={{ fontWeight: "bold" }}>
              {member?.username || member?.email}
            </Text>{" "}
            from the group?
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                marginRight: 10,
                backgroundColor: "#f1f5f9",
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
              }}
              disabled={isRemoving}
            >
              <Text
                style={{
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemove}
              style={{
                flex: 1,
                backgroundColor: "#e11d48",
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                minWidth: 90,
              }}
              disabled={isRemoving}
            >
              {isRemoving && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {isRemoving ? "Removing..." : "Remove"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Leave Group Modal ---
function LeaveGroupModal({ visible, onClose, onLeave, isLeaving }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            width: "80%",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Leave group
          </Text>
          <Text
            style={{
              fontSize: 16,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Are you sure you want to leave this group?
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                marginRight: 10,
                backgroundColor: "#f1f5f9",
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
              }}
              disabled={isLeaving}
            >
              <Text
                style={{
                  color: "#64748b",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onLeave}
              style={{
                flex: 1,
                backgroundColor: "#e11d48",
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                minWidth: 90,
              }}
              disabled={isLeaving}
            >
              {isLeaving && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {isLeaving ? "Leaving..." : "Leave"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Main MembersModals Component ---
export default function MembersModals({
  visible,
  onClose,
  groupData,
  currentUser,
}) {
  // --- State ---
  const [memberDetails, setMemberDetails] = useState([]);
  const [showKickModal, setShowKickModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedAddUsers, setSelectedAddUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // --- Effects ---
  // Listen for real-time updates to group (room) document
  useEffect(() => {
    if (groupData?.isGroup && groupData?.roomId) {
      const unsub = onSnapshot(
        doc(db, "rooms", groupData.roomId),
        (docSnap) => {
          if (docSnap.exists()) {
            // Optionally update groupData if needed
          }
        }
      );
      return () => unsub();
    }
  }, [groupData?.roomId, groupData?.isGroup]);

  // Fetch group member details when modal opens
  useEffect(() => {
    const fetchMembers = async () => {
      if (
        visible &&
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
  }, [visible, groupData]);

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

  // --- Handlers ---
  // Remove user from group
  const handleRemoveUser = async (uid) => {
    if (!groupData?.roomId || !Array.isArray(groupData?.users)) return;
    setIsRemoving(true);
    try {
      const userToRemove = memberDetails.find((u) => u.uid === uid);
      const updatedUsers = groupData.users.filter((u) => u !== uid);
      await updateDoc(doc(db, "rooms", groupData.roomId), {
        users: updatedUsers,
      });
      await addDoc(collection(doc(db, "rooms", groupData.roomId), "messages"), {
        text: `${userToRemove?.username || userToRemove?.email || userToRemove?.uid} was removed from the group`,
        type: "system-indicator",
        createdAt: serverTimestamp(),
        system: true,
      });
      setMemberDetails((prev) => prev.filter((u) => u.uid !== uid));
      setShowKickModal(false);
    } catch (e) {
      setShowKickModal(false);
      Alert.alert(
        "Error",
        "Failed to remove user from group. Please try again."
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
      const updatedUsers = Array.from(
        new Set([...(groupData.users || []), ...selectedUserIds])
      );
      await updateDoc(doc(db, "rooms", groupData.roomId), {
        users: updatedUsers,
      });
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
      setSelectedAddUsers([]);
      setSearchUser("");
      // Refresh memberDetails
      const q = query(usersRef, where("uid", "in", [...updatedUsers]));
      const snap = await getDocs(q);
      const members = snap.docs.map((doc) => doc.data());
      setMemberDetails(members);
    } catch (e) {
      setShowAddMemberModal(false);
      Alert.alert("Error", "Failed to add member(s). Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Handler for leaving group
  const handleLeaveGroup = async () => {
    if (!groupData?.roomId) return;
    setIsLeaving(true);
    try {
      const updatedUsers = groupData.users.filter(
        (uid) => uid !== currentUser.uid
      );
      await updateDoc(doc(db, "rooms", groupData.roomId), {
        users: updatedUsers,
      });
      await addDoc(collection(doc(db, "rooms", groupData.roomId), "messages"), {
        text: `${currentUser.username} left the group`,
        type: "system-indicator",
        createdAt: serverTimestamp(),
        system: true,
      });
      setShowLeaveModal(false);
      // Optionally, navigate or update UI to reflect leaving the group
    } catch (e) {
      setShowLeaveModal(false);
      Alert.alert("Error", "Failed to leave the group.");
    } finally {
      setIsLeaving(false);
    }
  };

  // --- Layout constants ---
  const maxModalHeight = hp(80); // 80% of screen height
  const modalWidth = wp(90); // 90% of screen width
  const minModalWidth = wp(80); // 80% min width

  // --- Render ---
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
            padding: 0,
            minWidth: minModalWidth,
            maxWidth: modalWidth,
            minHeight: hp(40),
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
            position: "relative",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            maxHeight: maxModalHeight,
            width: "100%",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View style={{ padding: wp(7), paddingBottom: 0 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: hp(2),
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{ marginRight: 12, padding: 4 }}
                activeOpacity={0.8}
              >
                <AntDesign name="left" size={hp(3)} color="#888" />
              </TouchableOpacity>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: hp(2.3),
                  color: "#222",
                  textAlign: "center",
                  flex: 1,
                }}
              >
                Members
              </Text>
              {/* Spacer for alignment */}
              <View style={{ width: hp(3) }} />
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "#e5e7eb",
                marginBottom: hp(1.2),
              }}
            />
          </View>
          {/* Members List */}
          <View style={{ flex: 1, minHeight: 60, paddingHorizontal: wp(7) }}>
            {loadingMembers ? (
              <View style={{ alignItems: "center", marginVertical: hp(2.5) }}>
                <Text style={{ color: "#6366f1", fontSize: hp(2) }}>
                  Loading...
                </Text>
              </View>
            ) : memberDetails.length > 0 ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: hp(0) }}
                showsVerticalScrollIndicator={memberDetails.length > 6}
              >
                {memberDetails.map((user) => (
                  <View
                    key={user.uid}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: hp(0.5),
                      paddingVertical: hp(0.7),
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
                        width: hp(4.5),
                        height: hp(4.5),
                        borderRadius: hp(2.25),
                        marginRight: hp(1.2),
                        backgroundColor: "#e0e7ff",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: hp(2),
                        flex: 1,
                        color: "#222",
                        fontWeight:
                          user.uid === currentUser?.uid ? "bold" : "normal",
                      }}
                    >
                      {user.username || user.email || user.uid}
                    </Text>
                    {user.uid === currentUser?.uid ? (
                      <TouchableOpacity
                        onPress={() => setShowLeaveModal(true)}
                        style={{
                          padding: hp(0.7),
                          borderRadius: 6,
                          backgroundColor: "#fef2f2",
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="exit" size={hp(2.7)} color="#e11d48" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMember(user);
                          setShowKickModal(true);
                        }}
                        style={{
                          padding: hp(0.7),
                          borderRadius: 6,
                          backgroundColor: "#fef2f2",
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="remove-circle"
                          size={hp(2.7)}
                          color="#e11d48"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text
                style={{
                  color: "#888",
                  fontSize: hp(1.8),
                  textAlign: "center",
                }}
              >
                No members found.
              </Text>
            )}
          </View>
          {/* Add Member button pinned to bottom as footer */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingHorizontal: wp(7),
              paddingBottom: hp(2.5),
              paddingTop: hp(2),
              backgroundColor: "#fff",
            }}
          >
            <TouchableOpacity
              onPress={() => setShowAddMemberModal(true)}
              disabled={isAdding}
            >
              <Text
                style={{
                  color: "#6366f1",
                  fontWeight: "bold",
                  fontSize: hp(1.8),
                }}
              >
                Add Member
              </Text>
            </TouchableOpacity>
          </View>
          {/* Kick and Leave Modals */}
          <KickMemberModal
            visible={showKickModal && !!selectedMember}
            onClose={() => setShowKickModal(false)}
            member={selectedMember}
            onRemove={() => handleRemoveUser(selectedMember?.uid)}
            isRemoving={isRemoving}
          />
          <LeaveGroupModal
            visible={showLeaveModal}
            onClose={() => setShowLeaveModal(false)}
            onLeave={handleLeaveGroup}
            isLeaving={isLeaving}
          />
        </View>
      </View>
      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        allUsers={allUsers}
        groupUsers={groupData.users || []}
        isAdding={isAdding}
        selectedAddUsers={selectedAddUsers}
        setSelectedAddUsers={setSelectedAddUsers}
        searchUser={searchUser}
        setSearchUser={setSearchUser}
        handleAddMember={handleAddMember}
      />
    </Modal>
  );
}
