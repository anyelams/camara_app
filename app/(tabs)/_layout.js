// app/_layout.js
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Iconos y etiquetas siempre en negro
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#000",
        tabBarLabelStyle: { color: "#000" },

        // Barra más compacta
        tabBarStyle: {
          height: 55,
          paddingTop: 2,
          paddingBottom: 2,
          ...Platform.select({ ios: { position: "absolute" }, default: {} }),
        },
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: "Cámara",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
