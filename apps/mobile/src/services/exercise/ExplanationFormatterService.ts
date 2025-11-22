/**
 * ExplanationFormatterService
 * 
 * Formats database-driven exercise substitution explanations into user-friendly text.
 * Uses existing scientific notes from the database (no AI needed).
 * 
 * Explanation Structure:
 * 1. Why Recommended (injury-specific context)
 * 2. Scientific Evidence (from database notes)
 * 3. Similarity Score (how close to original exercise)
 * 4. How to Use (practical guidance)
 * 5. Recovery Context (injury-specific recommendations)
 */

import { ExerciseSubstitution } from './ExerciseSubstitutionService';

export interface ExplanationContext {
  injured_body_part?: string;
  injury_type?: string;
  recovery_week?: number;
  pain_level?: number; // 0-10
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface FormattedExplanation {
  explanation: string;
  sections: {
    why_recommended: string;
    scientific_evidence: string;
    similarity_score: string;
    how_to_use: string;
    recovery_context?: string;
  };
}

class ExplanationFormatterService {
  /**
   * Format a substitution explanation from database notes
   * 
   * @param substitution - Exercise substitution data from database
   * @param context - User context (injury, recovery timeline, etc.)
   * @returns Formatted explanation with sections
   */
  formatExplanation(
    substitution: ExerciseSubstitution,
    context?: ExplanationContext
  ): FormattedExplanation {
    const sections = {
      why_recommended: this.formatWhyRecommended(substitution, context),
      scientific_evidence: this.formatScientificEvidence(substitution),
      similarity_score: this.formatSimilarityScore(substitution),
      how_to_use: this.formatHowToUse(substitution, context),
      recovery_context: context?.injured_body_part 
        ? this.formatRecoveryContext(substitution, context)
        : undefined,
    };

    // Combine all sections into full explanation
    const explanation = this.combineExplanation(sections);

    return {
      explanation,
      sections,
    };
  }

  /**
   * Format "Why Recommended" section
   */
  private formatWhyRecommended(
    substitution: ExerciseSubstitution,
    context?: ExplanationContext
  ): string {
    let text = `**Why ${substitution.substitute_name} is recommended:**\n\n`;

    // Injury-specific context
    if (context?.injured_body_part && substitution.reduced_stress_area !== 'none') {
      const bodyPartName = this.formatBodyPartName(context.injured_body_part);
      text += `✅ **Reduces ${bodyPartName} Stress**\n`;
      text += `This exercise is specifically designed to reduce stress on your ${bodyPartName.toLowerCase()}, making it ideal for your recovery.\n\n`;
    }

    // Movement pattern similarity
    text += `🎯 **Similar Movement Pattern**\n`;
    text += `Maintains the same "${this.formatMovementPattern(substitution.movement_pattern)}" pattern as ${substitution.exercise_name}, `;
    text += `so you won't lose the training stimulus.\n\n`;

    // Primary muscles
    const muscles = this.formatMuscleList(substitution.primary_muscles);
    text += `💪 **Targets Same Muscles**\n`;
    text += `Works: ${muscles}\n`;

    return text;
  }

  /**
   * Format "Scientific Evidence" section
   */
  private formatScientificEvidence(substitution: ExerciseSubstitution): string {
    let text = `**📊 Scientific Evidence:**\n\n`;

    // Parse and format the notes field
    const notes = substitution.notes || 'No additional scientific notes available.';
    
    // Split notes by semicolons and format as bullet points
    const noteParts = notes.split(';').map(part => part.trim()).filter(part => part.length > 0);
    
    if (noteParts.length > 0) {
      noteParts.forEach(note => {
        text += `• ${note}\n`;
      });
    } else {
      text += notes + '\n';
    }

    return text;
  }

  /**
   * Format "Similarity Score" section
   */
  private formatSimilarityScore(substitution: ExerciseSubstitution): string {
    const score = substitution.similarity_score;
    const percentage = Math.round(score * 100);
    
    let rating = '';
    let description = '';
    
    if (score >= 0.85) {
      rating = 'Excellent';
      description = 'This is a highly similar exercise - you won\'t lose any training gains!';
    } else if (score >= 0.75) {
      rating = 'Very Good';
      description = 'This is a very similar exercise with minimal differences.';
    } else if (score >= 0.65) {
      rating = 'Good';
      description = 'This is a good alternative that maintains most of the training stimulus.';
    } else {
      rating = 'Moderate';
      description = 'This alternative has some differences but still provides similar benefits.';
    }

    let text = `**⭐ Similarity Score: ${percentage}% (${rating})**\n\n`;
    text += description + '\n';

    return text;
  }

  /**
   * Format "How to Use" section
   */
  private formatHowToUse(
    substitution: ExerciseSubstitution,
    context?: ExplanationContext
  ): string {
    let text = `**🎯 How to Use:**\n\n`;

    // Equipment needed
    text += `**Equipment:** ${this.formatEquipment(substitution.equipment_required)}\n`;
    
    // Difficulty level
    text += `**Difficulty:** ${this.formatDifficulty(substitution.difficulty_level)}\n\n`;

    // Experience-specific guidance
    if (context?.experience_level) {
      text += this.getExperienceGuidance(substitution, context.experience_level) + '\n\n';
    }

    // General execution tips
    text += `**Execution Tips:**\n`;
    text += `• Focus on controlled movement throughout the full range of motion\n`;
    text += `• Maintain proper form over heavy weight\n`;
    text += `• Start with lighter weight to learn the movement pattern\n`;

    return text;
  }

  /**
   * Format "Recovery Context" section (injury-specific)
   */
  private formatRecoveryContext(
    _substitution: ExerciseSubstitution,
    context: ExplanationContext
  ): string {
    const bodyPartName = this.formatBodyPartName(context.injured_body_part!);
    
    let text = `**⚠️ For Your ${bodyPartName} Recovery:**\n\n`;

    // Recovery week guidance
    if (context.recovery_week !== undefined) {
      text += this.getRecoveryWeekGuidance(context.recovery_week, context.pain_level) + '\n\n';
    }

    // Pain level guidance
    if (context.pain_level !== undefined) {
      text += this.getPainLevelGuidance(context.pain_level) + '\n\n';
    }

    // Red flags
    text += `**⚠️ Stop Immediately If You Feel:**\n`;
    text += `• Sharp pain (vs dull muscle fatigue)\n`;
    text += `• Clicking or popping in the ${bodyPartName.toLowerCase()}\n`;
    text += `• Pain that persists after the set\n`;
    text += `• Numbness or tingling\n`;

    return text;
  }

  /**
   * Combine all sections into full explanation
   */
  private combineExplanation(sections: FormattedExplanation['sections']): string {
    let explanation = '';
    
    explanation += sections.why_recommended + '\n\n';
    explanation += sections.scientific_evidence + '\n\n';
    explanation += sections.similarity_score + '\n\n';
    explanation += sections.how_to_use;
    
    if (sections.recovery_context) {
      explanation += '\n\n' + sections.recovery_context;
    }

    return explanation;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatBodyPartName(bodyPart: string): string {
    const names: Record<string, string> = {
      shoulder: 'Shoulder',
      lower_back: 'Lower Back',
      knee: 'Knee',
      elbow: 'Elbow',
      hip: 'Hip',
      ankle: 'Ankle',
      wrist: 'Wrist',
      core: 'Core',
      hamstrings: 'Hamstrings',
    };
    return names[bodyPart] || bodyPart;
  }

  private formatMovementPattern(pattern: string): string {
    const patterns: Record<string, string> = {
      horizontal_push: 'Horizontal Push',
      vertical_push: 'Vertical Push',
      horizontal_pull: 'Horizontal Pull',
      vertical_pull: 'Vertical Pull',
      squat: 'Squat',
      hinge: 'Hip Hinge',
      lunge: 'Lunge',
      carry: 'Loaded Carry',
      rotation: 'Rotation',
    };
    return patterns[pattern] || pattern;
  }

  private formatMuscleList(muscles: string): string {
    return muscles
      .split(',')
      .map(m => m.trim().replace(/_/g, ' '))
      .map(m => m.charAt(0).toUpperCase() + m.slice(1))
      .join(', ');
  }

  private formatEquipment(equipment: string): string {
    const equipmentNames: Record<string, string> = {
      barbell: 'Barbell',
      dumbbell: 'Dumbbells',
      bodyweight: 'Bodyweight (no equipment)',
      machine: 'Machine',
      cable: 'Cable Machine',
      kettlebell: 'Kettlebell',
      resistance_band: 'Resistance Bands',
    };
    return equipmentNames[equipment] || equipment;
  }

  private formatDifficulty(difficulty: string): string {
    const levels: Record<string, string> = {
      beginner: 'Beginner-friendly',
      intermediate: 'Intermediate',
      'intermediate-advanced': 'Intermediate to Advanced',
      advanced: 'Advanced',
    };
    return levels[difficulty] || difficulty;
  }

  private getExperienceGuidance(
    _substitution: ExerciseSubstitution,
    experienceLevel: string
  ): string {
    if (experienceLevel === 'beginner') {
      return '**For Beginners:** Take extra time to learn proper form. Consider working with a trainer for the first few sessions.';
    } else if (experienceLevel === 'intermediate') {
      return '**For Intermediate Lifters:** You should be able to transition to this exercise smoothly. Focus on maintaining the same rep ranges.';
    } else {
      return '**For Advanced Lifters:** You can likely match or exceed your previous training intensity with this substitute.';
    }
  }

  private getRecoveryWeekGuidance(recoveryWeek: number, _painLevel?: number): string {
    if (recoveryWeek <= 2) {
      return `**Week ${recoveryWeek} Recovery:** Start with 40-50% of your normal weight. Focus on pain-free movement and building confidence.`;
    } else if (recoveryWeek <= 4) {
      return `**Week ${recoveryWeek} Recovery:** Increase to 60-70% of normal weight if pain-free. Gradually increase volume.`;
    } else if (recoveryWeek <= 6) {
      return `**Week ${recoveryWeek} Recovery:** Progress to 80-90% of normal weight if full ROM is pain-free. Monitor for any setbacks.`;
    } else {
      return `**Week ${recoveryWeek}+ Recovery:** You should be close to full capacity. Continue monitoring and adjust as needed.`;
    }
  }

  private getPainLevelGuidance(painLevel: number): string {
    if (painLevel === 0) {
      return '**Pain Level 0/10:** Great! You can progress normally while staying cautious.';
    } else if (painLevel <= 2) {
      return `**Pain Level ${painLevel}/10:** Mild discomfort is okay, but don't push through sharp pain.`;
    } else if (painLevel <= 4) {
      return `**Pain Level ${painLevel}/10:** Reduce weight and volume. Focus on quality movement.`;
    } else if (painLevel <= 6) {
      return `**Pain Level ${painLevel}/10:** Consider taking a rest day or reducing intensity significantly.`;
    } else {
      return `**Pain Level ${painLevel}/10:** This is too high. Rest and consult a healthcare professional if pain persists.`;
    }
  }
}

export default new ExplanationFormatterService();

