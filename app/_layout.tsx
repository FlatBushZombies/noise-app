import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: "#0f172a",
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTitleStyle: {
            fontWeight: "700",
          },
          tabBarActiveTintColor: "#0f172a",
          tabBarInactiveTintColor: "#64748b",
          tabBarStyle: {
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 14,
            height: 64,
            borderRadius: 24,
            borderTopWidth: 0,
            backgroundColor: "rgba(255,255,255,0.92)",
            elevation: 0,
            shadowColor: "#94a3b8",
            shadowOpacity: 0.25,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Live Meter",
            tabBarIcon: ({ color, size }) => <MaterialIcons name="graphic-eq" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="challenge"
          options={{
            title: "Fan Challenge",
            tabBarIcon: ({ color, size }) => <MaterialIcons name="emoji-events" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="hype"
          options={{
            title: "Hype Feed",
            tabBarIcon: ({ color, size }) => <MaterialIcons name="bolt" size={size} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
