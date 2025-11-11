import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, Activity } from 'lucide-react-native';
import tokens from '../theme/tokens';

// Import screens (redesigned versions)
import HomeScreen from '../screens/HomeScreenRedesign';
import ChatScreen from '../screens/ChatScreen';
import RunScreen from '../screens/RunScreenRedesign';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Chat"
        screenOptions={{
          tabBarActiveTintColor: tokens.colors.accent.primary,
          tabBarInactiveTintColor: tokens.colors.text.tertiary,
          tabBarStyle: {
            height: tokens.layout.tabBarHeight,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: tokens.colors.background.secondary,
            borderTopColor: tokens.colors.border.light,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: tokens.colors.background.secondary,
          },
          headerTintColor: tokens.colors.accent.primary,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            headerShown: true,
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
            headerShown: true,
          }}
        />
        <Tab.Screen
          name="Run"
          component={RunScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
            headerShown: true,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

