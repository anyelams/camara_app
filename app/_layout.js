import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";
import { useColorScheme } from "../hooks/useColorScheme";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }
  return React.createElement(
    ThemeProvider,
    { value: colorScheme === "dark" ? DarkTheme : DefaultTheme },
    React.createElement(
      Stack,
      null,
      React.createElement(Stack.Screen, {
        name: "(tabs)",
        options: { headerShown: false },
      }),
      React.createElement(Stack.Screen, { name: "+not-found" })
    ),
    React.createElement(StatusBar, { style: "auto" })
  );
}
