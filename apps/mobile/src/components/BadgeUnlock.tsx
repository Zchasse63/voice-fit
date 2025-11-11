/**
 * BadgeUnlock
 *
 * Simple animated badge unlock component (MVP version).
 * Shows celebration animation when user earns a badge.
 * Integrates with PR detection and streak tracking.
 *
 * NOTE: Using simple React Native Animated API for MVP.
 * Future enhancement: Replace with Lottie animations (see docs/FUTURE_TODO_LIST.md)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Trophy, X, Flame, Dumbbell, Award, CheckCircle } from 'lucide-react-native';
import tokens from '../theme/tokens';

const { width } = Dimensions.get('window');

export type BadgeType =
  | 'streak_3day'
  | 'streak_7day'
  | 'streak_30day'
  | 'streak_100day'
  | 'volume_10k'
  | 'volume_50k'
  | 'volume_100k'
  | 'volume_500k'
  | 'pr_first'
  | 'pr_10'
  | 'pr_50'
  | 'consistency_80'
  | 'consistency_90'
  | 'consistency_100';

interface BadgeUnlockProps {
  visible: boolean;
  badgeType: BadgeType;
  badgeName: string;
  badgeDescription: string;
  onClose: () => void;
}

export default function BadgeUnlock({
  visible,
  badgeType,
  badgeName,
  badgeDescription,
  onClose,
}: BadgeUnlockProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      rotateAnim.setValue(0);

      // Start celebration animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getBadgeIcon = () => {
    // Map badge types to icons (simple MVP version)
    if (badgeType.startsWith('streak')) {
      return <Flame color={getBadgeColor()} size={64} />;
    } else if (badgeType.startsWith('volume')) {
      return <Dumbbell color={getBadgeColor()} size={64} />;
    } else if (badgeType.startsWith('pr')) {
      return <Trophy color={getBadgeColor()} size={64} />;
    } else if (badgeType.startsWith('consistency')) {
      return <CheckCircle color={getBadgeColor()} size={64} />;
    }
    return <Award color={getBadgeColor()} size={64} />;
  };

  const getBadgeColor = () => {
    // Different colors for different badge categories
    if (badgeType.startsWith('streak')) {
      return tokens.colors.badge.gold;
    } else if (badgeType.startsWith('volume')) {
      return tokens.colors.badge.silver;
    } else if (badgeType.startsWith('pr')) {
      return tokens.colors.badge.bronze;
    } else if (badgeType.startsWith('consistency')) {
      return tokens.colors.badge.platinum;
    }
    return tokens.colors.accent.primary;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={tokens.colors.text.primary} size={24} />
          </TouchableOpacity>

          {/* Celebration Text */}
          <Text style={styles.celebrationText}>🎉 Badge Unlocked! 🎉</Text>

          {/* Badge Icon Animation (Simple MVP version) */}
          <Animated.View
            style={[
              styles.animationContainer,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            {getBadgeIcon()}
          </Animated.View>

          {/* Badge Info */}
          <View style={[styles.badgeInfo, { borderTopColor: getBadgeColor() }]}>
            <View style={[styles.badgeIcon, { backgroundColor: getBadgeColor() + '20' }]}>
              <Trophy color={getBadgeColor()} size={32} />
            </View>

            <Text style={styles.badgeName}>{badgeName}</Text>
            <Text style={styles.badgeDescription}>{badgeDescription}</Text>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: getBadgeColor() }]}
            onPress={() => {
              // TODO: Implement share functionality
              console.log('Share badge');
              onClose();
            }}
          >
            <Text style={styles.shareButtonText}>Share Achievement</Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueButtonText}>Continue Training</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    ...tokens.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    padding: 8,
    zIndex: 1,
  },
  celebrationText: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: tokens.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInfo: {
    width: '100%',
    alignItems: 'center',
    paddingTop: tokens.spacing.md,
    borderTopWidth: 2,
    marginBottom: tokens.spacing.md,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  badgeName: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  badgeDescription: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  shareButton: {
    width: '100%',
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  shareButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
  },
  continueButton: {
    width: '100%',
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    backgroundColor: tokens.colors.background.primary,
  },
  continueButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.primary,
  },
});

