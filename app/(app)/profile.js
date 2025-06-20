import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import React from "react";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useAuth } from "../../context/authContext";

const { width: screenWidth } = Dimensions.get("window");
const BG_WIDTH = screenWidth * 0.9;
const PROFILE_SIZE = wp(22);
const BORDER_RADIUS = 16;

const Profile = () => {
  const { user } = useAuth();
  const profileUrl = user?.profileUrl;
  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const phone = user?.phone;

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
      </View>
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
});

export default Profile;
