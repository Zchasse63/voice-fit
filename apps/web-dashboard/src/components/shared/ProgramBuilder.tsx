"use client";

/**
 * ProgramBuilder Component
 * 
 * Displays and manages training programs for users.
 * Shared between Premium and Coach dashboards.
 * 
 * CRITICAL: Matches iOS app design - clean program view with week-by-week breakdown
 */

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, ChevronRight, Plus, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramBuilderProps {
  userId: string;
  className?: string;
}

interface Week {
  weekNumber: number;
  days: Day[];
}

interface Day {
  dayNumber: number;
  workouts: Workout[];
}

interface Workout {
  id: string;
  name: string;
  type: "strength" | "cardio" | "rest";
  duration?: number;
  exercises?: Exercise[];
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
}

export function ProgramBuilder({ userId, className }: ProgramBuilderProps) {
  const [program, setProgram] = useState<Week[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, [userId]);

  const fetchProgram = async () => {
    try {
      setIsLoading(true);
      // TODO: Call backend API
      const response = await fetch(`/api/programs/${userId}/active`);
      const data = await response.json();
      
      setProgram(data.program?.weeks || []);
    } catch (error) {
      console.error("Error fetching program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case "strength":
        return "bg-primary-500 dark:bg-primary-dark";
      case "cardio":
        return "bg-secondary-500 dark:bg-secondary-dark";
      case "rest":
        return "bg-gray-400 dark:bg-gray-600";
      default:
        return "bg-accent-500 dark:bg-accent-dark";
    }
  };

  if (isLoading) {
    return (
      <div className={cn("card flex items-center justify-center h-64", className)}>
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Loading program...
        </p>
      </div>
    );
  }

  if (program.length === 0) {
    return (
      <div className={cn("card", className)}>
        <div className="text-center py-xl">
          <Calendar className="w-12 h-12 mx-auto mb-md text-text-light-tertiary dark:text-text-dark-tertiary" />
          <h3 className="text-lg font-semibold mb-sm text-text-light-primary dark:text-text-dark-primary">
            No Active Program
          </h3>
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary mb-lg">
            Generate a new training program to get started
          </p>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Generate Program
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Training Program
        </h2>
        <button className="p-2 rounded-md hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary transition-colors">
          <Edit2 className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
        </button>
      </div>

      {/* Weeks */}
      <div className="space-y-md">
        {program.map((week) => (
          <div
            key={week.weekNumber}
            className="border border-border-light-light dark:border-border-dark-light rounded-md overflow-hidden"
          >
            {/* Week Header */}
            <button
              onClick={() => toggleWeek(week.weekNumber)}
              className="w-full flex items-center justify-between p-md bg-background-light-secondary dark:bg-background-dark-secondary hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary transition-colors"
            >
              <div className="flex items-center gap-sm">
                {expandedWeeks.has(week.weekNumber) ? (
                  <ChevronDown className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
                )}
                <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                  Week {week.weekNumber}
                </span>
              </div>
              <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                {week.days.reduce((acc, day) => acc + day.workouts.length, 0)} workouts
              </span>
            </button>

            {/* Week Content */}
            {expandedWeeks.has(week.weekNumber) && (
              <div className="p-md space-y-sm">
                {week.days.map((day) => (
                  <div key={day.dayNumber} className="space-y-xs">
                    <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                      Day {day.dayNumber}
                    </p>

                    {day.workouts.length === 0 ? (
                      <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary pl-md">
                        Rest day
                      </p>
                    ) : (
                      <div className="space-y-xs pl-md">
                        {day.workouts.map((workout) => (
                          <div
                            key={workout.id}
                            className="flex items-center gap-sm p-sm rounded-md bg-background-light-primary dark:bg-background-dark-primary border border-border-light-subtle dark:border-border-dark-subtle"
                          >
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                getWorkoutTypeColor(workout.type)
                              )}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                                {workout.name}
                              </p>
                              {workout.duration && (
                                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                                  {workout.duration} min
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


