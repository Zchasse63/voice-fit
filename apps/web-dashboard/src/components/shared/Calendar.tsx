"use client";

/**
 * Calendar Component
 * 
 * Displays workout calendar with scheduled and completed workouts.
 * Shared between Premium and Coach dashboards.
 * 
 * CRITICAL: Matches iOS app design - clean, minimal calendar view
 */

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";

interface CalendarProps {
  userId: string;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

interface WorkoutDay {
  date: string;
  hasWorkout: boolean;
  isCompleted: boolean;
}

export function Calendar({ userId, onDateSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, [userId, currentMonth]);

  const fetchWorkouts = async () => {
    try {
      // TODO: Call backend API
      const response = await fetch(
        `/api/workouts/${userId}?month=${format(currentMonth, "yyyy-MM")}`
      );
      const data = await response.json();
      
      setWorkoutDays(data.workouts || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const hasWorkout = (date: Date) => {
    return workoutDays.some((day) => isSameDay(new Date(day.date), date));
  };

  const isCompleted = (date: Date) => {
    const day = workoutDays.find((d) => isSameDay(new Date(d.date), date));
    return day?.isCompleted || false;
  };

  return (
    <div className={cn("card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <div className="flex gap-sm">
          <button
            onClick={previousMonth}
            className="p-2 rounded-md hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary transition-smooth"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary transition-smooth"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-xs mb-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-text-light-tertiary dark:text-text-dark-tertiary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-xs">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {daysInMonth.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const hasWorkoutToday = hasWorkout(date);
          const isCompletedToday = isCompleted(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center transition-smooth relative",
                "hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary",
                isSelected && "bg-accent-light-blue dark:bg-accent-dark-blue text-white",
                isTodayDate && !isSelected && "border-2 border-accent-light-blue dark:border-accent-dark-blue"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isSelected ? "text-white" : "text-text-light-primary dark:text-text-dark-primary"
              )}>
                {format(date, "d")}
              </span>
              
              {/* Workout indicator */}
              {hasWorkoutToday && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1",
                  isCompletedToday
                    ? "bg-accent-light-green dark:bg-accent-dark-green"
                    : "bg-accent-light-orange dark:bg-accent-dark-orange"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-lg mt-lg pt-lg border-t border-border-light-light dark:border-border-dark-light">
        <div className="flex items-center gap-xs">
          <div className="w-3 h-3 rounded-full bg-accent-light-green dark:bg-accent-dark-green" />
          <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Completed
          </span>
        </div>
        <div className="flex items-center gap-xs">
          <div className="w-3 h-3 rounded-full bg-accent-light-orange dark:bg-accent-dark-orange" />
          <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Scheduled
          </span>
        </div>
      </div>
    </div>
  );
}

