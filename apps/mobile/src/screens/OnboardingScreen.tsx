/**
 * OnboardingScreen Component
 * 
 * Multi-screen onboarding flow for new users
 * Features: Voice-First Logging, Track Your Progress, AI-Powered Coaching
 */

import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { Mic, TrendingUp, MessageCircle, ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: typeof Mic;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Voice-First Logging',
    description: 'Log your sets instantly with voice commands. Just say "bench press 225 for 10" and you\'re done.',
    icon: Mic,
    color: '#2C5F3D',
  },
  {
    id: 2,
    title: 'Track Your Progress',
    description: 'Visualize your strength gains with beautiful charts and track your PRs automatically.',
    icon: TrendingUp,
    color: '#DD7B57',
  },
  {
    id: 3,
    title: 'AI-Powered Coaching',
    description: 'Get personalized workout advice and form tips from your AI coach, available 24/7.',
    icon: MessageCircle,
    color: '#36625E',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      {/* Skip Button */}
      <View className="absolute top-12 right-6 z-10">
        <Pressable
          onPress={handleSkip}
          accessibilityLabel="Skip"
          accessibilityHint="Skips the onboarding and goes to the app"
          accessibilityRole="button"
        >
          <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 items-center justify-center px-8"
          >
            {/* Icon */}
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{ backgroundColor: `${slide.color}20` }}
            >
              <slide.icon color={slide.color} size={64} />
            </View>

            {/* Title */}
            <Text className={`text-3xl font-bold text-center mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {slide.title}
            </Text>

            {/* Description */}
            <Text className={`text-lg text-center leading-7 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View className="flex-row justify-center mb-8">
        {slides.map((_, index) => {
          const dotStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ];

            const width = interpolate(
              scrollX.value,
              inputRange,
              [8, 24, 8],
              Extrapolate.CLAMP
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.3, 1, 0.3],
              Extrapolate.CLAMP
            );

            return {
              width: withTiming(width, { duration: 200 }),
              opacity: withTiming(opacity, { duration: 200 }),
            };
          });

          return (
            <Animated.View
              key={index}
              className={`h-2 rounded-full mx-1 ${isDark ? 'bg-primaryDark' : 'bg-primary-500'}`}
              style={dotStyle}
            />
          );
        })}
      </View>

      {/* Next/Get Started Button */}
      <View className="px-8 pb-12">
        <Pressable
          className={`flex-row items-center justify-center p-4 rounded-xl min-h-[60px] ${
            isDark ? 'bg-primaryDark' : 'bg-primary-500'
          }`}
          onPress={handleNext}
          accessibilityLabel={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          accessibilityHint={
            currentIndex === slides.length - 1
              ? 'Completes onboarding and starts using the app'
              : 'Shows the next onboarding screen'
          }
          accessibilityRole="button"
        >
          <Text className="text-lg font-bold text-white mr-2">
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <ChevronRight color="white" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

