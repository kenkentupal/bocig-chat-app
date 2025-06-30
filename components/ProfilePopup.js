import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { AntDesign } from '@expo/vector-icons';

const ProfilePopup = ({ visible, profile, onClose }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  const PROFILE_SIZE = wp(42); // responsive profile image size
  const BORDER_RADIUS = 16;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  if (!profile) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <AntDesign name="left" size={20} color="#fff" />
              </TouchableOpacity>

              {/* Profile Top Group: BG + Profile Image */}
              <View style={styles.topGroup}>
                <View style={styles.illustrationContainer}>
                  <Image
                    source={require("../assets/images/bg-profile.png")}
                    style={[
                      styles.illustration,
                      { width: wp(70), borderRadius: BORDER_RADIUS, alignSelf: "center" },
                    ]}
                  />
                  {/* Profile Image */}
                  <View
                    style={[
                      styles.profileImageWrapper,
                      {
                        borderRadius: BORDER_RADIUS,
                        alignSelf: "center",
                        bottom: -PROFILE_SIZE / 2,
                        padding: 4,
                      },
                    ]}
                  >
                    <Image
                      source={{
                        uri: profile.profileUrl || "https://placekitten.com/200/200",
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
              <View style={{ alignSelf: "center", alignItems: "center", marginTop: PROFILE_SIZE * 0.6 }}>
                <Text style={{ fontSize: wp("5"), fontWeight: "bold", color: "#222", textAlign: "center" }}>
                  {profile.firstName || profile.username || profile.name || "Unknown"} {profile.lastName || ""}
                </Text>
                {profile.phone && (
                  <Text style={{ fontSize: wp("3.5"), color: "#666", marginTop: 2, textAlign: "center" }}>
                    {profile.phone}
                  </Text>
                )}
                {profile.email && (
                  <Text style={{ fontSize: wp("3.5"), color: "#666", marginTop: 2, textAlign: "center" }}>
                    {profile.email}
                  </Text>
                )}
              </View>

              {/* Optionally, add more fields here */}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: wp(80), // responsive width
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: wp(6), // responsive padding
    alignItems: "center",
    elevation: 6,
  },
  closeButton: {
    position: "absolute",
    top: 30,
    left: 24,
    zIndex: 2,
    padding: 8, // match editprofile touch area
  },
  // New styles for the copied layout
  topGroup: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  illustrationContainer: {
    alignItems: "center",
    width: "100%",
  },
  illustration: {
    height: hp(16),
    resizeMode: "cover",
    alignSelf: "center",
  },
  profileImageWrapper: {
    position: "absolute",
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignSelf: "center",
  },
});

export default ProfilePopup;
