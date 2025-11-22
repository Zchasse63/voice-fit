import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

interface CountdownOverlayProps {
  value: number;
  isVisible: boolean;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ value, isVisible }) => {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && value > 0) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(1);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value, isVisible]);

  if (!isVisible || value === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.countdownCircle,
          {
            backgroundColor: colors.accent.blue + '20',
            borderColor: colors.accent.blue,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text
          style={[
            styles.countdownText,
            {
              color: colors.accent.blue,
            },
          ]}
        >
          {value}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
  },
});

