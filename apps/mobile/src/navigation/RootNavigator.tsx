import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Home, MessageCircle, Activity } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";

// Import redesigned screens
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import RunScreen from "../screens/RunScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: colors.accent.blue,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2.5} />
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={size} strokeWidth={2.5} />
          ),
          tabBarLabel: "Run",
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} strokeWidth={2.5} />
          ),
          tabBarLabel: "Chat",
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}
