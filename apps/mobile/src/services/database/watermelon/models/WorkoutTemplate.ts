/**
 * WorkoutTemplate Model
 *
 * Represents a reusable workout template that can be scheduled on the calendar.
 * Templates define the structure of a workout including exercises, duration, and type.
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export interface Exercise {
  id?: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  rest?: number; // seconds
  notes?: string;
}

export default class WorkoutTemplate extends Model {
  static table = 'workout_templates';

  @field('program_id') programId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('workout_type') workoutType?: string; // 'strength', 'cardio', 'hiit', 'recovery', 'custom'
  @field('color') color!: string; // hex color for visual coding
  @field('estimated_duration') estimatedDuration?: number; // minutes
  @field('difficulty') difficulty?: string; // 'beginner', 'intermediate', 'advanced'
  @field('exercises') exercisesJson!: string; // JSON string of exercise definitions
  @field('notes') notes?: string;
  @field('is_template') isTemplate!: boolean;
  @field('synced') synced!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed properties
  get exercises(): Exercise[] {
    try {
      return JSON.parse(this.exercisesJson) as Exercise[];
    } catch (error) {
      console.error('Failed to parse exercises JSON:', error);
      return [];
    }
  }

  get exerciseCount(): number {
    return this.exercises.length;
  }

  get totalSets(): number {
    return this.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  }

  get workoutTypeDisplay(): string {
    const typeMap: Record<string, string> = {
      strength: 'Strength Training',
      cardio: 'Cardio',
      hiit: 'HIIT',
      recovery: 'Recovery',
      flexibility: 'Flexibility',
      custom: 'Custom',
    };
    return typeMap[this.workoutType || 'custom'] || 'Custom';
  }

  get difficultyDisplay(): string {
    const difficultyMap: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return difficultyMap[this.difficulty || ''] || '';
  }

  get estimatedDurationDisplay(): string {
    if (!this.estimatedDuration) return 'Not set';
    const hours = Math.floor(this.estimatedDuration / 60);
    const minutes = this.estimatedDuration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
