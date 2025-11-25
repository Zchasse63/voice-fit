"use client";

/**
 * ProgramPreview Component
 * 
 * Shows parsed program structure before publishing.
 * Displays exercises/sets/reps/progression and allows final edits.
 */

import { useState } from "react";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest_seconds?: number;
  notes?: string;
}

interface Workout {
  name: string;
  day: string;
  exercises: Exercise[];
}

interface Week {
  week_number: number;
  workouts: Workout[];
}

function parseCSVToWeeks(rows: any[], fieldMapping: Record<string, string>): Week[] {
  const weeksMap = new Map<number, Map<string, Workout>>();

  rows.forEach((row) => {
    const weekNum = parseInt(row[fieldMapping.week_number] || "1");
    const day = row[fieldMapping.day_of_week] || "Unknown";
    const workoutName = row[fieldMapping.workout_name] || "Workout";
    const exerciseName = row[fieldMapping.exercise_name] || "Exercise";
    const sets = parseInt(row[fieldMapping.sets] || "3");
    const reps = row[fieldMapping.reps] || "10";
    const weight = row[fieldMapping.weight];
    const restSeconds = parseInt(row[fieldMapping.rest_seconds] || "60");
    const notes = row[fieldMapping.notes];

    if (!weeksMap.has(weekNum)) {
      weeksMap.set(weekNum, new Map());
    }

    const workoutsMap = weeksMap.get(weekNum)!;
    const workoutKey = `${day}-${workoutName}`;

    if (!workoutsMap.has(workoutKey)) {
      workoutsMap.set(workoutKey, {
        name: workoutName,
        day,
        exercises: [],
      });
    }

    const workout = workoutsMap.get(workoutKey)!;
    workout.exercises.push({
      name: exerciseName,
      sets,
      reps,
      weight,
      rest_seconds: restSeconds,
      notes,
    });
  });

  return Array.from(weeksMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, workoutsMap]) => ({
      week_number: weekNumber,
      workouts: Array.from(workoutsMap.values()),
    }));
}

interface ProgramPreviewProps {
  programName: string;
  weeks: Week[];
  qualityScore: number;
  qualityIssues: any[];
  csvRows?: any[];
  fieldMapping?: Record<string, string>;
  onEdit?: (weekNumber: number, workoutIndex: number, exerciseIndex: number) => void;
  onDelete?: (weekNumber: number, workoutIndex: number, exerciseIndex: number) => void;
  onProceed: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProgramPreview({
  programName,
  weeks: initialWeeks,
  qualityScore,
  qualityIssues,
  csvRows = [],
  fieldMapping = {},
  onEdit,
  onDelete,
  onProceed,
  onCancel,
  isLoading = false,
}: ProgramPreviewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));

  // Parse CSV rows into weeks structure if provided
  const weeks = initialWeeks.length > 0 ? initialWeeks : parseCSVToWeeks(csvRows, fieldMapping);

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-success-light dark:text-success-dark";
    if (score >= 60) return "text-warning-light dark:text-warning-dark";
    return "text-error-light dark:text-error-dark";
  };

  return (
    <div className="space-y-lg">
      {/* Program Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-md">
          {programName}
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Total Weeks: {weeks.length}
            </p>
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              Total Workouts: {weeks.reduce((sum, w) => sum + w.workouts.length, 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Quality Score</p>
            <p className={cn("text-2xl font-bold", getQualityColor(qualityScore))}>
              {qualityScore}/100
            </p>
          </div>
        </div>
      </div>

      {/* Quality Issues */}
      {qualityIssues.length > 0 && (
        <div className="card border border-warning-light/30 dark:border-warning-dark/30 bg-warning-light/5 dark:bg-warning-dark/5">
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-md">
            Quality Feedback
          </h3>
          <div className="space-y-sm">
            {qualityIssues.map((issue, idx) => (
              <div key={idx} className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                • {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-md">
        {weeks.map((week) => (
          <div key={week.week_number} className="card">
            <button
              onClick={() => toggleWeek(week.week_number)}
              className="w-full flex items-center justify-between p-md hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary rounded-md transition-colors"
            >
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                Week {week.week_number}
              </h3>
              <ChevronDown
                className={cn(
                  "w-5 h-5 transition-transform",
                  expandedWeeks.has(week.week_number) && "rotate-180"
                )}
              />
            </button>

            {expandedWeeks.has(week.week_number) && (
              <div className="space-y-md p-md border-t border-border-light-light dark:border-border-dark-light">
                {week.workouts.map((workout, wIdx) => (
                  <div key={wIdx} className="bg-background-light-secondary dark:bg-background-dark-secondary p-md rounded-md">
                    <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-sm">
                      {workout.day}: {workout.name}
                    </h4>
                    <div className="space-y-xs">
                      {workout.exercises.map((exercise, eIdx) => (
                        <div key={eIdx} className="flex items-center justify-between text-sm">
                          <div className="flex-1">
                            <p className="text-text-light-primary dark:text-text-dark-primary">
                              {exercise.name}
                            </p>
                            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                              {exercise.sets}x{exercise.reps}
                              {exercise.weight && ` @ ${exercise.weight}`}
                              {exercise.rest_seconds && ` (${exercise.rest_seconds}s rest)`}
                            </p>
                          </div>
                          <div className="flex gap-xs">
                            <button
                              onClick={() => onEdit(week.week_number, wIdx, eIdx)}
                              className="p-xs hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(week.week_number, wIdx, eIdx)}
                              className="p-xs hover:bg-error-light/10 dark:hover:bg-error-dark/10 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-error-light dark:text-error-dark" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-md">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={onProceed}
          className="btn-primary flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Proceed to Assignment"}
        </button>
      </div>
    </div>
  );
}

