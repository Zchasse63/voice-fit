import React from "react";
import { View, Text } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";

// Import redesigned screens
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import RunScreen from "../screens/RunScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgramLogScreen from "../screens/ProgramLogScreen";

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
          height: 84,
          paddingBottom: 18,
          paddingTop: 10,
          backgroundColor: colors.background.primary,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: tokens.typography.fontSize.xs,
          fontFamily: tokens.typography.fontFamily.system,
          fontWeight: tokens.typography.fontWeight.medium,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                fontSize: 22,
                color: focused ? colors.accent.blue : colors.text.tertiary,
              }}
            >
              🏠
            </Text>
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: tokens.borderRadius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused
                  ? colors.accent.blue
                  : colors.background.secondary,
                marginTop: -10,
                ...tokens.shadows.xl,
              }}
            >
              <Text
                style={{
                  fontSize: 26,
                  color: "#FFFFFF",
                }}
              >
                🤖
              </Text>
            </View>
          ),
          tabBarLabel: "Coach",
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text
              style={{
                fontSize: 22,
                color: focused ? colors.accent.blue : colors.text.tertiary,
              }}
            >
              🏃
            </Text>
          ),
          tabBarLabel: "Run",
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
        name="ProgramLog"
        component={ProgramLogScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
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
