// app/(auth)/_layout.js
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function AuthLayout() {
  const [loaded] = useFonts({
    RobotoBold: require("../../assets/fonts/Roboto-Bold.ttf"),
    RobotoSemiBold: require("../../assets/fonts/Roboto-SemiBold.ttf"),
    RobotoMedium: require("../../assets/fonts/Roboto-Medium.ttf"),
    RobotoRegular: require("../../assets/fonts/Roboto-Regular.ttf"),
    RobotoLight: require("../../assets/fonts/Roboto-Light.ttf"),
    ...AntDesign.font,
    ...Ionicons.font,
    ...Feather.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    LogBox.ignoreLogs([
      "Support for defaultProps will be removed from function components",
    ]);
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { marginHorizontal: 0, paddingHorizontal: 0 },
      }}
    />
  );
}
