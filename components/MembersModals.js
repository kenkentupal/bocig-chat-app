import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MembersModals({
  showMembersModal,
  setShowMembersModal,
  memberDetails,
  loadingMembers,
  currentUser,
  item,
  setShowAddMemberModal,
  showKickModal,
  setShowKickModal,
  selectedMember,
  setSelectedMember,
  handleRemoveUser,
  isRemoving,
  showLeaveModal,
  setShowLeaveModal,
  navigation,
  router,
  setMemberDetails,
  setAllUsers,
}) {
  const memberCount = memberDetails.length;
  const baseHeight = 180;
  const perMember = 52;
  const maxModalHeight = 420;
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
            style={{ height: 1, backgroundColor: "#e5e7eb", marginBottom: 10 }}
          />
          {/* Members list with dynamic height */}
          {loadingMembers ? (
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <Text style={{ color: "#6366f1", fontSize: 16 }}>Loading...</Text>
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
            <Text style={{ color: "#888", fontSize: 15, textAlign: "center" }}>
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
                        await item.updateRoomUsers(updatedUsers);
                        await item.addSystemMessage(
                          `${currentUser?.username || currentUser?.email || currentUser?.uid} left the group`
                        );
                        if (navigation && navigation.canGoBack()) {
                          navigation.goBack();
                        } else {
                          router.replace("/messages");
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
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
