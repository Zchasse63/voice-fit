import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Minus, Plus, X } from "lucide-react-native";
import tokens from "../../theme/tokens";
import { useTheme } from "../../theme/ThemeContext";
import { useWorkoutStore } from "../../store/workout.store";
import { AnalyticsService } from "../../services/analytics/AnalyticsService";
import { AnalyticsEvents } from "../../services/analytics/events";

export interface QuickLogDraft {
  exerciseName: string;
  weight?: number;
  reps?: number;
  rpe?: number;
}

interface QuickLogBarProps {
  draft: QuickLogDraft;
  onLogged?: () => void;
  onDismiss?: () => void;
}

const QuickLogBar: React.FC<QuickLogBarProps> = ({ draft, onLogged, onDismiss }) => {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];

  const activeWorkout = useWorkoutStore((s) => s.activeWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const addSet = useWorkoutStore((s) => s.addSet);

  const [exerciseName, setExerciseName] = useState(draft.exerciseName);
  const [weight, setWeight] = useState<number | undefined>(draft.weight);
  const [reps, setReps] = useState<number | undefined>(draft.reps);
  const [rpe, setRpe] = useState<number | undefined>(draft.rpe);

  useEffect(() => {
    setExerciseName(draft.exerciseName);
    setWeight(draft.weight);
    setReps(draft.reps);
    setRpe(draft.rpe);
  }, [draft.exerciseName, draft.weight, draft.reps, draft.rpe]);

  const adjustNumber = (value: number | undefined, delta: number) => {
    const base = value ?? 0;
    const next = base + delta;
    return next < 0 ? 0 : next;
  };

  const handleLog = () => {
    const trimmedName = exerciseName.trim();
    if (!trimmedName) {
      Alert.alert("Missing exercise", "Please enter an exercise name to log.");
      return;
    }
    if (weight == null || reps == null) {
      Alert.alert(
        "Missing details",
        "Please set weight and reps before logging your set.",
      );
      return;
    }

    if (!activeWorkout) {
      startWorkout("Quick Log Workout");
    }

    addSet({
      exerciseName: trimmedName,
      weight,
      reps,
      rpe,
      loggingMethod: "quick_log",
    });

    void AnalyticsService.logEvent(AnalyticsEvents.QUICK_LOG_ACCEPT_CLICKED, {
      exercise_name: trimmedName,
      weight,
      reps,
      rpe,
      source: "quick_log_bar",
    });

    if (onLogged) {
      onLogged();
    }
  };

  const renderNumberField = (
    label: string,
    value: number | undefined,
    onChange: (next: number | undefined) => void,
    step: number,
  ) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>
          {label}
        </Text>
        <View style={styles.fieldRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onChange(adjustNumber(value, -step))}
          >
            <Minus size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.numberInput, { color: colors.text.primary }]}
            keyboardType="numeric"
            value={value != null ? String(value) : ""}
            onChangeText={(text) => {
              const num = Number(text.replace(/[^0-9.]/g, ""));
              if (Number.isNaN(num)) {
                onChange(undefined);
              } else {
                onChange(num);
              }
            }}
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onChange(adjustNumber(value, step))}
          >
            <Plus size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.light,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Quick Log</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
            <X size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={[styles.exerciseInput, { color: colors.text.primary }]}
        placeholder="Exercise name"
        placeholderTextColor={colors.text.tertiary}
        value={exerciseName}
        onChangeText={setExerciseName}
      />

      <View style={styles.fieldsRow}>
        {renderNumberField("Weight", weight, setWeight, 5)}
        {renderNumberField("Reps", reps, setReps, 1)}
        {renderNumberField("RPE", rpe, setRpe, 1)}
      </View>

      <TouchableOpacity
        style={[
          styles.logButton,
          { backgroundColor: tokens.colors.light.accent.blue },
        ]}
        onPress={handleLog}
        activeOpacity={0.8}
      >
        <Text style={styles.logButtonText}>Accept & Log Set</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.md,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
  },
  closeButton: {
    padding: tokens.spacing.xs,
  },
  exerciseInput: {
    borderWidth: 1,
    borderColor: tokens.colors.light.border.light,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    marginBottom: tokens.spacing.sm,
  },
  fieldsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: tokens.spacing.sm,
  },
  fieldContainer: {
    flex: 1,
    marginRight: tokens.spacing.xs,
  },
  fieldLabel: {
    fontSize: tokens.typography.fontSize.xs,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 6,
    borderWidth: 1,
    borderColor: tokens.colors.light.border.light,
    borderRadius: tokens.borderRadius.full,
  },
  numberInput: {
    minWidth: 40,
    textAlign: "center",
    marginHorizontal: 4,
    paddingVertical: 2,
  },
  logButton: {
    marginTop: tokens.spacing.xs,
    paddingVertical: 10,
    borderRadius: tokens.borderRadius.md,
    alignItems: "center",
  },
  logButtonText: {
    color: "#FFFFFF",
    fontWeight: tokens.typography.fontWeight.semibold,
  },
});

export default QuickLogBar;

