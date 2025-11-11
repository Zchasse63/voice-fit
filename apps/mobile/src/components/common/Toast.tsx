/**
 * Toast
 * 
 * Simple toast notification component for showing temporary messages.
 * Used for success, error, warning, and info messages.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import tokens from '../../theme/tokens';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

export default function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = tokens.colors.text.inverse;

    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'error':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return tokens.colors.accent.success;
      case 'error':
        return tokens.colors.accent.error;
      case 'warning':
        return tokens.colors.accent.warning;
      case 'info':
      default:
        return tokens.colors.accent.primary;
    }
  };

  if (!visible && opacity._value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: tokens.spacing.md,
    right: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  iconContainer: {
    marginRight: tokens.spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.inverse,
  },
});

