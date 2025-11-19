import { supabase } from './database/supabase.client';
import { useAuthStore } from '../store/auth.store';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rpe?: number;
  rest?: string;
  notes?: string;
}

export interface DailyWorkout {
  day: number;
  focus: string;
  exercises: WorkoutExercise[];
}

export interface ProgramWeek {
  week: number;
  phase: string;
  days: DailyWorkout[];
}

export interface ProgramStructure {
  name: string;
  description: string;
  weeks: ProgramWeek[];
}

export interface GeneratedProgramResponse {
  program: ProgramStructure;
  cost: any;
  stats: any;
}

export class ProgramService {
  private static instance: ProgramService;

  private constructor() { }

  static getInstance(): ProgramService {
    if (!ProgramService.instance) {
      ProgramService.instance = new ProgramService();
    }
    return ProgramService.instance;
  }

  /**
   * Get the user's current active program
   */
  async getCurrentProgram(): Promise<ProgramStructure | null> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return null;

      // First check user_profiles for current_program_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_program_id')
        .eq('user_id', userId)
        .single() as any;

      if (profileError || !profile?.current_program_id) {
        // Fallback: get the most recent generated program
        const { data: recentProgram, error: recentError } = await supabase
          .from('generated_programs')
          .select('program_data')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as any;

        if (recentError || !recentProgram || !recentProgram.program_data) return null;

        const programData = recentProgram.program_data as GeneratedProgramResponse;
        return programData.program;
      }

      // Get the specific program
      const { data: program, error: programError } = await supabase
        .from('generated_programs')
        .select('program_data')
        .eq('id', profile.current_program_id)
        .single() as any;

      if (programError || !program || !program.program_data) return null;

      const programData = program.program_data as GeneratedProgramResponse;
      return programData.program;

    } catch (error) {
      console.error('Error fetching current program:', error);
      return null;
    }
  }

  /**
   * Get the workout for a specific date based on the program schedule
   * Assumes program started on the Monday of the week it was created, 
   * or we need a 'start_date' in user_profiles.
   * 
   * For MVP, we might just map:
   * Week 1 Day 1 -> Monday of Week 1
   */
  async getScheduledWorkout(date: Date): Promise<DailyWorkout | null> {
    const program = await this.getCurrentProgram();
    if (!program) return null;

    // TODO: Get actual start date from profile. 
    // For now, assume program started this week (Monday) if no start date found,
    // or just show the workout corresponding to the current day of week if we are in "Week 1" mode.

    // Ideally, we need to know:
    // 1. When did the program start?
    // 2. What week/day are we currently in?

    // Let's fetch the program start date
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('program_start_date')
      .eq('user_id', userId)
      .single() as any;

    let startDate = profile?.program_start_date ? new Date(profile.program_start_date) : new Date();

    // Calculate week and day number
    const diffTime = Math.abs(date.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // This is a simplified logic. Real logic needs to handle "Day 1 = Monday" alignment etc.
    // For MVP, let's just return the workout for the current weekday if it exists in the current week.

    // 0 = Sunday, 1 = Monday, ...
    let dayOfWeek = date.getDay();
    // Adjust to 1-based index where Monday is 1
    let dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Find workout for this dayIndex in Week 1 (MVP)
    // TODO: Implement full calendar logic
    const week1 = program.weeks.find(w => w.week === 1);
    if (!week1) return null;

    const workout = week1.days.find(d => d.day === dayIndex);
    return workout || null;
  }
}

export const programService = ProgramService.getInstance();
