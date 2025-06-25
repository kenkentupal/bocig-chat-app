import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Linking,
  Animated, // add this
  Easing, // add this
} from "react-native";
import React, { useState } from "react";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useAuth } from "../../context/authContext";
import EditProfile from "./editprofile";

const { width: screenWidth } = Dimensions.get("window");
const BG_WIDTH = screenWidth * 0.9;
const PROFILE_SIZE = wp(22);
const BORDER_RADIUS = 16;

const Profile = ({ onEditProfile }) => {
  const { user, logout } = useAuth();
  const profileUrl = user?.profileUrl;
  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const phone = user?.phone;
  const email = user?.email;
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editAnim] = useState(new Animated.Value(0)); // animation value

  // Animate in when modal is shown
  React.useEffect(() => {
    if (showEditProfile) {
      editAnim.setValue(0);
      Animated.timing(editAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [showEditProfile]);

  const handleHelpPress = () => {
    const email = "support@yourapp.com"; // Change to your support email
    const subject = encodeURIComponent("Help Request");
    const body = encodeURIComponent("Describe your issue here...");
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl);
  };

  return (
    <View style={styles.container}>
      {/* Profile Top Group: BG + Profile Image */}
      <View style={styles.topGroup}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require("../../assets/images/bg-profile.png")}
            style={[
              styles.illustration,
              { width: wp(90), borderRadius: BORDER_RADIUS },
            ]}
          />
          {/* Profile Image */}
          <View
            style={[
              styles.profileImageWrapper,
              {
                borderRadius: BORDER_RADIUS,
                alignSelf: "flex-start",
                bottom: -PROFILE_SIZE / 2,
                padding: 4,
                marginLeft: wp(5),
              },
            ]}
          >
            <Image
              source={{
                uri: profileUrl || "../../assets/images/boclogo.png",
              }}
              style={{
                width: PROFILE_SIZE,
                height: PROFILE_SIZE,
                borderRadius: BORDER_RADIUS,
              }}
            />
          </View>
        </View>
      </View>

      {/* User Name and Phone Group */}
      <View style={{ left: wp(12), marginTop: PROFILE_SIZE * 0.6 }}>
        <Text style={{ fontSize: wp(5), fontWeight: "bold", color: "#222" }}>
          {firstName} {lastName}
        </Text>
        <Text style={{ fontSize: wp(3.5), color: "#666", marginTop: 2 }}>
          {phone}
        </Text>
        <Text style={{ fontSize: wp(3.5), color: "#666", marginTop: 2 }}>
          {email}
        </Text>
      </View>

      {/* Action Buttons */}
      <View
        style={{
          alignSelf: "center",
          marginTop: wp(7),
          width: wp(90), // Match BG width
          maxWidth: BG_WIDTH,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonMinimal,
            { width: "96%" }, // fill most of the container, leaving a small margin
          ]}
          onPress={() => setShowEditProfile(true)}
        >
          <Text
            style={[styles.actionButtonText, styles.actionButtonTextMinimal]}
          >
            Edit Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonMinimal,
            { width: "96%" },
          ]}
          onPress={handleHelpPress}
        >
          <Text
            style={[styles.actionButtonText, styles.actionButtonTextMinimal]}
          >
            Help
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonMinimal,
            styles.actionButtonLogout,
            { width: "96%" },
          ]}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text
            style={[styles.actionButtonText, styles.actionButtonTextLogout]}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalLogout]}
                onPress={async () => {
                  setLogoutModalVisible(false);
                  await logout();
                }}
              >
                <Text style={styles.modalLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="fade"
        transparent
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.18)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.View
            style={{
              width: "94%",
              maxWidth: 420,
              backgroundColor: "#fff",
              borderRadius: 22,
              paddingVertical: 24,
              paddingHorizontal: 18,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 18,
              elevation: 16,
              opacity: editAnim,
              transform: [
                {
                  scale: editAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            }}
          >
            <EditProfile onDone={() => setShowEditProfile(false)} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: hp(3),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  topGroup: {
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationContainer: {
    alignItems: "center",
  },
  illustration: {
    height: hp(25),
    resizeMode: "cover",
  },
  profileImageWrapper: {
    position: "absolute",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButton: {
    width: "100%",
    paddingVertical: hp(1.3),
    borderRadius: 10,
    marginTop: hp(1.2),
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonMinimal: {
    backgroundColor: "#f5f6fa",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 0,
    shadowOpacity: 0,
  },
  actionButtonText: {
    fontWeight: "500",
    fontSize: wp(4),
    letterSpacing: 0.1,
  },
  actionButtonTextMinimal: {
    color: "#222",
  },
  actionButtonLogout: {
    backgroundColor: "#fff1f2",
    borderColor: "#fca5a5",
  },
  actionButtonTextLogout: {
    color: "#ef4444",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: wp(80),
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    elevation: 8,
  },
  modalTitle: {
    fontSize: wp(4.5),
    fontWeight: "bold",
    color: "#222",
    marginBottom: 20,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalCancel: {
    backgroundColor: "#f5f6fa",
  },
  modalLogout: {
    backgroundColor: "#fff1f2",
  },
  modalCancelText: {
    color: "#222",
    fontWeight: "500",
    fontSize: wp(4),
  },
  modalLogoutText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: wp(4),
  },
});

export default Profile;
