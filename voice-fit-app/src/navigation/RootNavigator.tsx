import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BarChart3, PlusCircle, Trophy, MessageCircle } from 'lucide-react-native';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import StartScreen from '../screens/StartScreen';
import PRsScreen from '../screens/PRsScreen';
import CoachScreen from '../screens/CoachScreen';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2C5F3D', // primary-500
          tabBarInactiveTintColor: '#9CA3AF', // gray-400
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: '#FBF7F5', // background-light
          },
          headerStyle: {
            backgroundColor: '#FBF7F5', // background-light
          },
          headerTintColor: '#2C5F3D', // primary-500
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
          component={StartScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <PlusCircle color={color} size={size * 1.5} />
            ),
            tabBarLabel: 'START',
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

