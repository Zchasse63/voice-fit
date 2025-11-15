import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEnhancedExerciseSwap } from '../hooks/useEnhancedExerciseSwap';
import { EnhancedExerciseSwapCard } from '../components/chat/EnhancedExerciseSwapCard';
import type { ExerciseSubstitute } from '../services/exercise/EnhancedExerciseSwapService';

/**
 * Example screen demonstrating enhanced exercise swap functionality
 * This shows how to integrate the enhanced swap service and UI components
 */
export const ExerciseSwapExampleScreen: React.FC = () => {
  // Hook for enhanced swap functionality
  const {
    loading,
    error,
    response,
    contextBadges,
    getSubstitutions,
    getLegacySubstitutions,
    clearCache,
    getCacheStats,
    reset,
  } = useEnhancedExerciseSwap({
    autoGenerateBadges: true,
    enableCache: true,
    useAIRanking: false, // Set to true for premium users
  });

  // Form state
  const [exercise, setExercise] = useState('');
  const [injuries, setInjuries] = useState<string[]>([]);
  const [injuryInput, setInjuryInput] = useState('');
  const [equipmentUnavailable, setEquipmentUnavailable] = useState<string[]>([]);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Handle search
  const handleSearch = async () => {
    if (!exercise.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    await getSubstitutions(exercise.trim(), {
      injuries: injuries.length > 0 ? injuries : undefined,
      equipmentUnavailable: equipmentUnavailable.length > 0 ? equipmentUnavailable : undefined,
      useAIRanking: useAI,
    });
  };

  // Handle legacy search
  const handleLegacySearch = async () => {
    if (!exercise.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    await getLegacySubstitutions(exercise.trim());
  };

  // Handle substitute selection
  const handleSubstituteSelect = (substitute: ExerciseSubstitute) => {
    Alert.alert(
      'Substitute Selected',
      `You selected: ${substitute.exercise}\n\nMatch: ${Math.round(
        substitute.similarity_score * 100
      )}%\n\n${substitute.reasoning}`,
      [
        { text: 'OK' },
        {
          text: 'Use This',
          onPress: () => {
            console.log('User confirmed substitute:', substitute.exercise);
            // TODO: Integrate with workout logging
          },
        },
      ]
    );
  };

  // Add injury
  const addInjury = () => {
    if (injuryInput.trim() && !injuries.includes(injuryInput.trim())) {
      setInjuries([...injuries, injuryInput.trim()]);
      setInjuryInput('');
    }
  };

  // Add equipment
  const addEquipment = () => {
    if (equipmentInput.trim() && !equipmentUnavailable.includes(equipmentInput.trim())) {
      setEquipmentUnavailable([...equipmentUnavailable, equipmentInput.trim()]);
      setEquipmentInput('');
    }
  };

  // Show cache stats
  const showCacheStats = async () => {
    const stats = await getCacheStats();
    const ageHours = stats.oldestAge ? (stats.oldestAge / (1000 * 60 * 60)).toFixed(1) : 'N/A';
    Alert.alert('Cache Stats', `Cached items: ${stats.count}\nOldest: ${ageHours} hours`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Enhanced Exercise Swap</Text>
            <Text style={styles.headerSubtitle}>
              Context-aware exercise substitutions with AI
            </Text>
          </View>

          {/* Exercise Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Exercise Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Barbell Back Squat"
              value={exercise}
              onChangeText={setExercise}
              autoCapitalize="words"
            />
          </View>

          {/* Context Inputs */}
          <View style={styles.section}>
            <Text style={styles.label}>Injuries/Restrictions (Optional)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="e.g., knee pain"
                value={injuryInput}
                onChangeText={setInjuryInput}
                autoCapitalize="words"
              />
              <TouchableOpacity style={styles.addButton} onPress={addInjury}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {injuries.length > 0 && (
              <View style={styles.chipContainer}>
                {injuries.map((injury, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{injury}</Text>
                    <TouchableOpacity
                      onPress={() => setInjuries(injuries.filter((_, i) => i !== index))}
                    >
                      <Text style={styles.chipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Equipment Unavailable (Optional)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="e.g., barbell"
                value={equipmentInput}
                onChangeText={setEquipmentInput}
                autoCapitalize="words"
              />
              <TouchableOpacity style={styles.addButton} onPress={addEquipment}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {equipmentUnavailable.length > 0 && (
              <View style={styles.chipContainer}>
                {equipmentUnavailable.map((equipment, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{equipment}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setEquipmentUnavailable(equipmentUnavailable.filter((_, i) => i !== index))
                      }
                    >
                      <Text style={styles.chipRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Options */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setUseAI(!useAI)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, useAI && styles.checkboxChecked]}>
                {useAI && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxLabel}>
                <Text style={styles.checkboxText}>Use AI Re-ranking</Text>
                <Text style={styles.checkboxSubtext}>Premium feature - slower but smarter</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setShowDebug(!showDebug)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, showDebug && styles.checkboxChecked]}>
                {showDebug && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>Show Debug Info</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Get Substitutes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleLegacySearch}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Legacy Mode</Text>
            </TouchableOpacity>
          </View>

          {/* Utility Buttons */}
          <View style={styles.utilityRow}>
            <TouchableOpacity style={styles.utilityButton} onPress={reset}>
              <Text style={styles.utilityButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.utilityButton} onPress={showCacheStats}>
              <Text style={styles.utilityButtonText}>Cache Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.utilityButton} onPress={clearCache}>
              <Text style={styles.utilityButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error.message}</Text>
            </View>
          )}

          {/* Results */}
          {response && (
            <EnhancedExerciseSwapCard
              response={response}
              onSubstituteSelect={handleSubstituteSelect}
              contextBadges={contextBadges}
              showDebugInfo={showDebug}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
  chipRemove: {
    fontSize: 18,
    color: '#6366F1',
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  checkboxSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  utilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  utilityButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  utilityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
  },
});

export default ExerciseSwapExampleScreen;
