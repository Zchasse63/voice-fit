/**
 * AdherenceAlertCard
 * 
 * Custom message component for adherence alerts in chat.
 * Shows when user is falling behind on program or has imbalances.
 * Allows user to check in and adjust program.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { AlertTriangle, CheckCircle, X } from 'lucide-react-native';
import tokens from '../theme/tokens';

interface AdherenceAlertCardProps {
  alertType: 'missed_workouts' | 'imbalance' | 'overtraining';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  onCheckIn: (response: string) => void;
}

export default function AdherenceAlertCard({
  alertType,
  title,
  description,
  severity,
  onCheckIn,
}: AdherenceAlertCardProps) {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInResponse, setCheckInResponse] = useState('');

  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return tokens.colors.accent.error;
      case 'medium':
        return tokens.colors.accent.warning;
      case 'low':
        return tokens.colors.accent.success;
      default:
        return tokens.colors.accent.warning;
    }
  };

  const handleCheckIn = () => {
    onCheckIn(checkInResponse);
    setShowCheckInModal(false);
    setCheckInResponse('');
  };

  return (
    <>
      <View style={[styles.container, { borderLeftColor: getSeverityColor() }]}>
        {/* Alert Icon */}
        <View style={[styles.iconContainer, { backgroundColor: getSeverityColor() + '20' }]}>
          <AlertTriangle color={getSeverityColor()} size={24} />
        </View>

        {/* Alert Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {/* Check-in Button */}
          <TouchableOpacity
            style={[styles.checkInButton, { backgroundColor: getSeverityColor() }]}
            onPress={() => setShowCheckInModal(true)}
          >
            <CheckCircle color={tokens.colors.text.inverse} size={18} />
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Check-in Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowCheckInModal(false)}
          />

          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check In</Text>
              <TouchableOpacity
                onPress={() => setShowCheckInModal(false)}
                style={styles.closeButton}
              >
                <X color={tokens.colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Alert Info */}
            <View style={styles.alertInfo}>
              <AlertTriangle color={getSeverityColor()} size={20} />
              <Text style={styles.alertInfoText}>{title}</Text>
            </View>

            {/* Input */}
            <Text style={styles.inputLabel}>
              How are you feeling? What's been going on?
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Tell me what's happening..."
              placeholderTextColor={tokens.colors.text.tertiary}
              value={checkInResponse}
              onChangeText={setCheckInResponse}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Suggestions */}
            <Text style={styles.suggestionsTitle}>Quick Responses:</Text>
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => setCheckInResponse('I\'ve been busy with work')}
              >
                <Text style={styles.suggestionText}>Busy with work</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => setCheckInResponse('Feeling tired and need more recovery')}
              >
                <Text style={styles.suggestionText}>Need more recovery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => setCheckInResponse('Minor injury, need to adjust')}
              >
                <Text style={styles.suggestionText}>Minor injury</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !checkInResponse && styles.submitButtonDisabled,
              ]}
              onPress={handleCheckIn}
              disabled={!checkInResponse}
            >
              <Text style={styles.submitButtonText}>Submit Check-In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
    borderLeftWidth: 4,
    flexDirection: 'row',
    ...tokens.shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.sm,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    alignSelf: 'flex-start',
  },
  checkInButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
    marginLeft: 6,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: tokens.colors.background.secondary,
    borderTopLeftRadius: tokens.borderRadius.xl,
    borderTopRightRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  modalTitle: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.accent.warning + '20',
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  alertInfoText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginLeft: tokens.spacing.sm,
    flex: 1,
  },
  inputLabel: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
  },
  input: {
    backgroundColor: tokens.colors.background.primary,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.sm,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
    borderWidth: 1,
    borderColor: tokens.colors.border.light,
    marginBottom: tokens.spacing.md,
    minHeight: 100,
  },
  suggestionsTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.md,
  },
  suggestionChip: {
    backgroundColor: tokens.colors.accent.primary + '20',
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    marginRight: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  suggestionText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.accent.primary,
  },
  submitButton: {
    backgroundColor: tokens.colors.accent.primary,
    borderRadius: tokens.borderRadius.md,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: tokens.colors.text.tertiary,
  },
  submitButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
  },
});

