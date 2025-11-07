import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, BarChart3, PlusCircle, Trophy, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import StartScreen from '../screens/StartScreen';
import PRsScreen from '../screens/PRsScreen';
import CoachScreen from '../screens/CoachScreen';
import RunScreen from '../screens/RunScreen';

const Tab = createBottomTabNavigator();
const StartStack = createNativeStackNavigator();

function StartStackNavigator() {
  return (
    <StartStack.Navigator>
      <StartStack.Screen
        name="StartMain"
        component={StartScreen}
        options={{ headerShown: false }}
      />
      <StartStack.Screen
        name="RunScreen"
        component={RunScreen}
        options={{ headerShown: false }}
      />
    </StartStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: isDark ? '#4A9B6F' : '#2C5F3D',
          tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: isDark ? '#1A1A1A' : '#FBF7F5',
            borderTopColor: isDark ? '#333333' : '#E0E0E0',
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: isDark ? '#1A1A1A' : '#FBF7F5',
          },
          headerTintColor: isDark ? '#4A9B6F' : '#2C5F3D',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Log"
          component={LogScreen}
          options={{
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="START"
          component={StartStackNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <PlusCircle color={color} size={size * 1.5} />
            ),
            tabBarLabel: 'START',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="PRs"
          component={PRsScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Coach"
          component={CoachScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MessageCircle color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

