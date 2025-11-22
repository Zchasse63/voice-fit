/**
 * OnboardingService
 *
 * Manages conversational onboarding flow in Chat.
 * Uses Llama 3.3 70B for natural conversation.
 * Extracts structured data for program generation.
 */

import { apiClient } from './api/config';
import { useAuthStore } from '../store/auth.store';
import { supabase } from './database/supabase.client';

export type OnboardingStep =
  | 'welcome'
  | 'experience_level'
  | 'training_goals'
  | 'available_equipment'
  | 'training_frequency'
  | 'injury_history'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  data: {
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    trainingGoals?: string[];
    availableEquipment?: string[];
    trainingFrequency?: number;
    injuryHistory?: string;
  };
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export class OnboardingService {
  private static instance: OnboardingService;
  private state: OnboardingState | null = null;

  private constructor() {}

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Start onboarding flow
   */
  async startOnboarding(): Promise<string> {
    this.state = {
      currentStep: 'welcome',
      data: {},
      conversationHistory: [],
    };

    const welcomeMessage = `Welcome to VoiceFit! 💪 I'm excited to help you build a personalized training program.

I'll ask you a few questions to understand your goals and experience. This should only take a couple of minutes.

First, tell me about your training experience. Are you:
• A beginner (new to strength training)
• Intermediate (1-2 years of consistent training)
• Advanced (3+ years of serious training)

Just tell me in your own words!`;

    this.state.conversationHistory.push({
      role: 'assistant',
      content: welcomeMessage,
    });

    return welcomeMessage;
  }

  /**
   * Process user response and move to next step
   */
  async processResponse(userMessage: string): Promise<string> {
    if (!this.state) {
      return await this.startOnboarding();
    }

    // Add user message to history
    this.state.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Extract data from user message using Llama
    await this.extractDataFromMessage(userMessage);

    // Move to next step
    const nextMessage = await this.getNextStepMessage();

    // Add assistant message to history
    this.state.conversationHistory.push({
      role: 'assistant',
      content: nextMessage,
    });

    return nextMessage;
  }

  /**
   * Extract structured data from user message using Llama
   */
  private async extractDataFromMessage(message: string): Promise<void> {
    if (!this.state) return;

    try {
      // Call backend endpoint to extract data
      const extracted = await apiClient.post('/api/onboarding/extract', {
        message,
        current_step: this.state.currentStep,
        conversation_history: this.state.conversationHistory,
      });

      // Update state with extracted data
      if (extracted.experience_level) {
        this.state.data.experienceLevel = extracted.experience_level;
      }
      if (extracted.training_goals) {
        this.state.data.trainingGoals = extracted.training_goals;
      }
      if (extracted.available_equipment) {
        this.state.data.availableEquipment = extracted.available_equipment;
      }
      if (extracted.training_frequency) {
        this.state.data.trainingFrequency = extracted.training_frequency;
      }
      if (extracted.injury_history) {
        this.state.data.injuryHistory = extracted.injury_history;
      }
    } catch (error) {
      console.error('Error extracting data from message:', error);
      // Fallback to rule-based extraction
      this.fallbackExtraction(message);
    }
  }

  /**
   * Fallback rule-based extraction if API fails
   */
  private fallbackExtraction(message: string): void {
    if (!this.state) return;

    const lowerMessage = message.toLowerCase();

    // Extract experience level
    if (this.state.currentStep === 'experience_level') {
      if (lowerMessage.includes('beginner') || lowerMessage.includes('new')) {
        this.state.data.experienceLevel = 'beginner';
      } else if (lowerMessage.includes('advanced') || lowerMessage.includes('3+') || lowerMessage.includes('years')) {
        this.state.data.experienceLevel = 'advanced';
      } else {
        this.state.data.experienceLevel = 'intermediate';
      }
    }

    // Extract training frequency
    if (this.state.currentStep === 'training_frequency') {
      const numbers = message.match(/\d+/);
      if (numbers) {
        this.state.data.trainingFrequency = parseInt(numbers[0]);
      }
    }
  }

  /**
   * Get next step message based on current state
   */
  private async getNextStepMessage(): Promise<string> {
    if (!this.state) return '';

    switch (this.state.currentStep) {
      case 'welcome':
        this.state.currentStep = 'experience_level';
        return ''; // Already handled in startOnboarding

      case 'experience_level':
        this.state.currentStep = 'training_goals';
        return `Great! Now, what are your main training goals? For example:
• Build muscle and strength
• Lose fat while maintaining muscle
• Improve athletic performance
• General fitness and health

You can list multiple goals!`;

      case 'training_goals':
        this.state.currentStep = 'available_equipment';
        return `Perfect! Now, what equipment do you have access to? For example:
• Full gym (barbells, dumbbells, machines)
• Home gym (barbells, dumbbells, rack)
• Minimal equipment (dumbbells, resistance bands)
• Bodyweight only

Just describe what you have!`;

      case 'available_equipment':
        this.state.currentStep = 'training_frequency';
        return `Awesome! How many days per week can you train consistently?

Most people train 3-5 days per week, but I can work with any schedule!`;

      case 'training_frequency':
        this.state.currentStep = 'injury_history';
        return `Got it! Last question: Do you have any current injuries or past injuries I should know about?

This helps me avoid exercises that might aggravate them. If you're injury-free, just say "none"!`;

      case 'injury_history':
        this.state.currentStep = 'complete';
        return await this.completeOnboarding();

      default:
        return 'Something went wrong. Let me start over.';
    }
  }

  /**
   * Complete onboarding and trigger program generation
   */
  private async completeOnboarding(): Promise<string> {
    if (!this.state) return '';

    try {
      // Get user ID from auth store
      const userId = useAuthStore.getState().user?.id || 'current_user';

      // Save onboarding data to user_onboarding table
      const { error: onboardingError } = await (supabase
        .from('user_onboarding') as any)
        .upsert({
          user_id: userId,
          is_complete: false, // Will be set to true after program generation
          current_step: 'complete',
          data: this.state.data,
          updated_at: new Date().toISOString(),
        });

      if (onboardingError) {
        console.error('Error saving onboarding data:', onboardingError);
      }

      // Trigger program generation
      const program = await apiClient.post('/api/program/generate/strength', {
        user_id: userId,
        experience_level: this.state.data.experienceLevel,
        training_goals: this.state.data.trainingGoals,
        available_equipment: this.state.data.availableEquipment,
        training_frequency: this.state.data.trainingFrequency,
        injury_history: this.state.data.injuryHistory,
      });

      // Save generated program to database
      const { data: savedProgram, error: programError } = await ((supabase
        .from('generated_programs') as any)
        .insert({
          user_id: userId,
          program_data: program,
          created_at: new Date().toISOString(),
        })
        .select()
        .single());

      if (programError) {
        console.error('Error saving program:', programError);
      } else if (savedProgram) {
        // Update user profile with current program ID
        await ((supabase
          .from('user_profiles') as any)
          .upsert({
            user_id: userId,
            current_program_id: (savedProgram as any).id,
            updated_at: new Date().toISOString(),
          }));
      }

      // Mark onboarding as complete
      await ((supabase
        .from('user_onboarding') as any)
        .update({
          is_complete: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId));

      return `Perfect! I've got everything I need. 🎉

Based on your responses:
• Experience: ${this.state.data.experienceLevel}
• Goals: ${this.state.data.trainingGoals?.join(', ')}
• Equipment: ${this.state.data.availableEquipment?.join(', ')}
• Frequency: ${this.state.data.trainingFrequency} days/week
${this.state.data.injuryHistory && this.state.data.injuryHistory !== 'none' ? `• Injuries: ${this.state.data.injuryHistory}` : ''}

I'm generating your personalized 12-week program now. This will take about 30 seconds...

Your program will include:
• Progressive overload built in
• Deload weeks for recovery
• Exercise variations to keep it interesting
• Auto-regulation based on your daily readiness

I'll let you know when it's ready!`;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return 'There was an error generating your program. Please try again or contact support.';
    }
  }

  /**
   * Get current onboarding state
   */
  getState(): OnboardingState | null {
    return this.state;
  }

  /**
   * Check if onboarding is complete
   */
  isComplete(): boolean {
    return this.state?.currentStep === 'complete';
  }

  /**
   * Reset onboarding state
   */
  reset(): void {
    this.state = null;
  }
}

export const onboardingService = OnboardingService.getInstance();

