/**
 * Unit tests for ExplanationFormatterService
 * Tests database-driven explanation formatting
 */

import ExplanationFormatterService from '../../src/services/exercise/ExplanationFormatterService';
import { ExerciseSubstitution } from '../../src/services/exercise/ExerciseSubstitutionService';

describe('ExplanationFormatterService', () => {
  const mockSubstitution: ExerciseSubstitution = {
    id: '1',
    exercise_name: 'Barbell Bench Press',
    substitute_name: 'Dumbbell Bench Press',
    similarity_score: 0.88,
    reduced_stress_area: 'shoulder',
    movement_pattern: 'horizontal_push',
    primary_muscles: 'pectoralis_major,anterior_deltoid,triceps_brachii',
    equipment_required: 'dumbbell',
    difficulty_level: 'intermediate',
    notes: 'EMG shows 13-25% higher pec activation with dumbbells; greater ROM (can descend below chest); independent arm movement corrects imbalances; 6RM load ~40kg dumbbells vs 88kg barbell',
  };

  describe('formatExplanation', () => {
    it('should format basic explanation without context', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution);

      expect(result.explanation).toBeTruthy();
      expect(result.sections.why_recommended).toContain('Dumbbell Bench Press');
      expect(result.sections.scientific_evidence).toContain('EMG shows');
      expect(result.sections.similarity_score).toContain('88%');
      expect(result.sections.how_to_use).toContain('Dumbbells');
      expect(result.sections.recovery_context).toBeUndefined();
    });

    it('should include injury-specific context when provided', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
      });

      expect(result.sections.why_recommended).toContain('Reduces Shoulder Stress');
      expect(result.sections.recovery_context).toBeTruthy();
      expect(result.sections.recovery_context).toContain('Shoulder Recovery');
    });

    it('should include recovery week guidance', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
        recovery_week: 2,
      });

      expect(result.sections.recovery_context).toContain('Week 2 Recovery');
      expect(result.sections.recovery_context).toContain('40-50%');
    });

    it('should include pain level guidance', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
        pain_level: 3,
      });

      expect(result.sections.recovery_context).toContain('Pain Level 3/10');
    });

    it('should include experience level guidance', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        experience_level: 'beginner',
      });

      expect(result.sections.how_to_use).toContain('For Beginners');
    });

    it('should format similarity score correctly for different ranges', () => {
      const highSimilarity: ExerciseSubstitution = {
        ...mockSubstitution,
        similarity_score: 0.92,
      };
      const result1 = ExplanationFormatterService.formatExplanation(highSimilarity);
      expect(result1.sections.similarity_score).toContain('Excellent');

      const moderateSimilarity: ExerciseSubstitution = {
        ...mockSubstitution,
        similarity_score: 0.68,
      };
      const result2 = ExplanationFormatterService.formatExplanation(moderateSimilarity);
      expect(result2.sections.similarity_score).toContain('Good');
    });

    it('should parse scientific notes into bullet points', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution);

      expect(result.sections.scientific_evidence).toContain('•');
      expect(result.sections.scientific_evidence).toContain('EMG shows 13-25% higher pec activation');
      expect(result.sections.scientific_evidence).toContain('greater ROM');
    });

    it('should format muscle list correctly', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution);

      expect(result.sections.why_recommended).toContain('Pectoralis Major');
      expect(result.sections.why_recommended).toContain('Anterior Deltoid');
      expect(result.sections.why_recommended).toContain('Triceps Brachii');
    });

    it('should include red flags in recovery context', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
      });

      expect(result.sections.recovery_context).toContain('Stop Immediately');
      expect(result.sections.recovery_context).toContain('Sharp pain');
      expect(result.sections.recovery_context).toContain('Clicking or popping');
    });

    it('should combine all sections into full explanation', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
        recovery_week: 2,
        pain_level: 3,
        experience_level: 'intermediate',
      });

      expect(result.explanation).toContain('Why Dumbbell Bench Press is recommended');
      expect(result.explanation).toContain('Scientific Evidence');
      expect(result.explanation).toContain('Similarity Score');
      expect(result.explanation).toContain('How to Use');
      expect(result.explanation).toContain('Shoulder Recovery');
    });
  });

  describe('Edge cases', () => {
    it('should handle substitution with no reduced stress area', () => {
      const noStressReduction: ExerciseSubstitution = {
        ...mockSubstitution,
        reduced_stress_area: 'none',
      };

      const result = ExplanationFormatterService.formatExplanation(noStressReduction, {
        injured_body_part: 'shoulder',
      });

      expect(result.sections.why_recommended).not.toContain('Reduces Shoulder Stress');
    });

    it('should handle empty notes field', () => {
      const emptyNotes: ExerciseSubstitution = {
        ...mockSubstitution,
        notes: '',
      };

      const result = ExplanationFormatterService.formatExplanation(emptyNotes);

      expect(result.sections.scientific_evidence).toContain('No additional scientific notes');
    });

    it('should handle very low similarity scores', () => {
      const lowSimilarity: ExerciseSubstitution = {
        ...mockSubstitution,
        similarity_score: 0.55,
      };

      const result = ExplanationFormatterService.formatExplanation(lowSimilarity);

      expect(result.sections.similarity_score).toContain('Moderate');
    });

    it('should handle high pain levels', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
        pain_level: 8,
      });

      expect(result.sections.recovery_context).toContain('too high');
      expect(result.sections.recovery_context).toContain('consult a healthcare professional');
    });

    it('should handle late recovery weeks', () => {
      const result = ExplanationFormatterService.formatExplanation(mockSubstitution, {
        injured_body_part: 'shoulder',
        recovery_week: 10,
      });

      expect(result.sections.recovery_context).toContain('close to full capacity');
    });
  });
});

