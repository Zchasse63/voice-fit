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
import TrainingCalendarScreen from "../screens/TrainingCalendarScreen";
import JournalScreen from "../screens/JournalScreen";
import SplitsScreen from "../screens/SplitsScreen";
import RunSummaryScreen from "../screens/RunSummaryScreen";
import RunSettingsScreen from "../screens/RunSettingsScreen";
import WorkoutCelebrationScreen from "../screens/WorkoutCelebrationScreen";
import WorkoutBuilderScreen from "../screens/WorkoutBuilderScreen";
import PersonalInfoScreen from "../screens/PersonalInfoScreen";
import WearablesScreen from "../screens/WearablesScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import SupportScreen from "../screens/SupportScreen";

// Import detail screens
import VolumeDetailScreen from "../screens/VolumeDetailScreen";
import RecoveryDetailScreen from "../screens/RecoveryDetailScreen";

// Import coach screens
import ClientSelectorScreen from "../screens/coach/ClientSelectorScreen";
import InviteClientScreen from "../screens/coach/InviteClientScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { GlassTabBar } from "../components/navigation/GlassTabBar";
import { useRunStore } from "../store/run.store";

function MainTabs() {
  const theme = useTheme();
  const isDark = theme?.isDark ?? false;
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const isTracking = useRunStore((state) => state.isTracking);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => isTracking ? null : <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.blue,
        tabBarInactiveTintColor: colors.text.tertiary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🏠</Text>
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
                width: 48,
                height: 48,
                borderRadius: tokens.borderRadius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused
                  ? colors.accent.blue
                  : colors.background.secondary,
                ...tokens.shadows.lg,
              }}
            >
              <Text style={{ fontSize: 24 }}>🤖</Text>
            </View>
          ),
          tabBarLabel: "Coach",
        }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🏃</Text>
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
        name="Splits"
        component={SplitsScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="RunSettings"
        component={RunSettingsScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="RunSummary"
        component={RunSummaryScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="WorkoutCelebration"
        component={WorkoutCelebrationScreen}
        options={{
          animation: "fade",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TrainingCalendar"
        component={TrainingCalendarScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="PersonalInfo"
        component={PersonalInfoScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Wearables"
        component={WearablesScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      {/* Analytics Detail Screens */}
      <Stack.Screen
        name="VolumeDetail"
        component={VolumeDetailScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="RecoveryDetail"
        component={RecoveryDetailScreen}
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
      {/* Coach Screens */}
      <Stack.Screen
        name="ClientSelector"
        component={ClientSelectorScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="InviteClient"
        component={InviteClientScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      {/* Workout Builder */}
      <Stack.Screen
        name="WorkoutBuilder"
        component={WorkoutBuilderScreen}
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack.Navigator>
  );
}
