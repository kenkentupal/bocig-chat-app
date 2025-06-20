import { View, Text, Platform, StatusBar, Image, Alert } from "react-native";
import React from "react";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { blurhash } from "../utils/common";
import { useAuth } from "../context/authContext";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";
import { MenuItem } from "./CustomMenuItems";
import { AntDesign, Feather } from "@expo/vector-icons";

const ios = Platform.OS == "ios";

export default function HomeHeader() {
  const { user, logout } = useAuth();
  const { top } = useSafeAreaInsets();

  const handleProfile = () => {
    // Handle profile action here
  };
  const handleLogout = async () => {
    if (Platform.OS === "web") {
      // Web implementation
      if (window.confirm("Are you sure you want to logout?")) {
        await logout();
      }
    } else {
      // Native implementation (iOS/Android)
      Alert.alert(
        "Confirm Action",
        "Are you sure you want to logout?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: async () => {
              await logout();
              console.log("OK Pressed");
            },
          },
        ],
        { cancelable: false }
      );
    }
  };
  return (
    <>
      <StatusBar backgroundColor="#818cf8" barStyle="light-content" />
      <View
        style={{ paddingTop: ios ? top : top + 10 }}
        className="flex-row items-center justify-between px-6 bg-indigo-400 pb-4 pt-2 rounded-b-3xl shadow-md"
      >
        <View>
          <Text style={{ fontSize: hp(3) }} className="text-white font-medium">
            Messages
          </Text>
        </View>

        <View>
          <Menu>
            <MenuTrigger>
              <Image
                source={{ uri: user?.profileUrl }}
                style={{
                  height: hp(4.5),
                  width: hp(4.5),
                  borderRadius: 100,
                }}
              />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  borderRadius: 10,
                  borderCurve: "continuous",
                  marginTop: 40,
                  marginLeft: -30,
                  backgroundColor: "white",
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 2 },
                  width: wp(40),
                },
              }}
            >
              <MenuItem
                text="Profile"
                action={handleProfile}
                value={null}
                icon={<Feather name="user" size={hp(2.7)} color="#737373" />}
              />
              <Divider />
              <MenuItem
                text="Sign Out"
                action={handleLogout}
                value={null}
                icon={
                  <AntDesign name="logout" size={hp(2.7)} color="#737373" />
                }
              />
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </>
  );
}

const Divider = () => {
  return <View className="p-{1px} w-full bg-neutral-200" />;
};
