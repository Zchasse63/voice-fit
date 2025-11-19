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
import { tokens } from '../theme/tokens';
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
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
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
    <View
      style={{ flex: 1, backgroundColor: colors.background.primary }}
    >
      {/* Skip Button */}
      <View
        style={{
          position: "absolute",
          top: tokens.spacing.xl,
          right: tokens.spacing.lg,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={handleSkip}
          accessibilityLabel="Skip"
          accessibilityHint="Skips the onboarding and goes to the app"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.base,
              color: colors.text.secondary,
            }}
          >
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
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{
              width: SCREEN_WIDTH,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: tokens.spacing.xl,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: tokens.spacing.xl,
                backgroundColor: `${slide.color}20`,
              }}
            >
              <slide.icon color={slide.color} size={64} />
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: tokens.typography.fontSize["2xl"],
                fontWeight: tokens.typography.fontWeight.bold,
                textAlign: "center",
                marginBottom: tokens.spacing.sm,
                color: colors.text.primary,
              }}
            >
              {slide.title}
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                textAlign: "center",
                lineHeight: 24,
                color: colors.text.secondary,
              }}
            >
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: tokens.spacing.xl,
        }}
      >
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
              Extrapolate.CLAMP,
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.3, 1, 0.3],
              Extrapolate.CLAMP,
            );

            return {
              width: withTiming(width, { duration: 200 }),
              opacity: withTiming(opacity, { duration: 200 }),
            };
          });

          return (
            <Animated.View
              key={index}
              style={[
                {
                  height: 8,
                  borderRadius: 999,
                  marginHorizontal: 4,
                  backgroundColor: colors.accent.blue,
                },
                dotStyle,
              ]}
            />
          );
        })}
      </View>

      {/* Next/Get Started Button */}
      <View
        style={{
          paddingHorizontal: tokens.spacing.xl,
          paddingBottom: tokens.spacing["2xl"],
        }}
      >
        <Pressable
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: tokens.spacing.md,
            borderRadius: tokens.borderRadius.xl,
            minHeight: 60,
            backgroundColor: colors.accent.blue,
            opacity: pressed ? 0.9 : 1,
          })}
          onPress={handleNext}
          accessibilityLabel={
            currentIndex === slides.length - 1 ? "Get Started" : "Next"
          }
          accessibilityHint={
            currentIndex === slides.length - 1
              ? "Completes onboarding and starts using the app"
              : "Shows the next onboarding screen"
          }
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: colors.text.onAccent,
              marginRight: tokens.spacing.xs,
            }}
          >
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <ChevronRight color={colors.text.onAccent} size={24} />
        </Pressable>
      </View>
    </View>
  );
}

