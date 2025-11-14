import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, MessageCircle, Activity, User } from "lucide-react-native";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";

// Import redesigned screens
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import RunScreen from "../screens/RunScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <NavigationContainer>
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
          headerStyle: {
            backgroundColor: colors.background.secondary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.semibold,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} strokeWidth={2.5} />
            ),
            headerShown: false, // HomeScreen has its own header
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
            headerShown: false, // RunScreen needs full screen for map
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
            headerShown: false, // ChatScreen has its own header
            tabBarLabel: "Chat",
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <User color={color} size={size} strokeWidth={2.5} />
            ),
            headerShown: false, // ProfileScreen has its own header
            tabBarLabel: "Profile",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
