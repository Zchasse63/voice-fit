/**
 * Unit tests for InjuryDetectionService
 * Tests NLP-based injury detection from user notes
 */

import { InjuryDetectionService } from '../../src/services/injury/InjuryDetectionService';

describe('InjuryDetectionService', () => {
  describe('analyzeNotes', () => {
    describe('No injury detected', () => {
      it('should return no injury for empty notes', () => {
        const result = InjuryDetectionService.analyzeNotes('');

        expect(result.injuryDetected).toBe(false);
        expect(result.confidence).toBe(0);
        expect(result.bodyPart).toBeNull();
        expect(result.severity).toBeNull();
        expect(result.description).toContain('No notes provided');
      });

      it('should return no injury for whitespace-only notes', () => {
        const result = InjuryDetectionService.analyzeNotes('   \n  \t  ');

        expect(result.injuryDetected).toBe(false);
        expect(result.confidence).toBe(0);
      });

      it('should detect false positives (hyperbolic expressions)', () => {
        const result = InjuryDetectionService.analyzeNotes('That workout killed me!');

        expect(result.injuryDetected).toBe(false);
        expect(result.description).toContain('Hyperbolic expression');
      });

      it('should detect normal DOMS', () => {
        const result = InjuryDetectionService.analyzeNotes('Feeling sore from yesterday but good overall');

        expect(result.injuryDetected).toBe(false);
        expect(result.description).toContain('Normal training soreness');
      });

      it('should detect positive training context', () => {
        const result = InjuryDetectionService.analyzeNotes('Great workout today, feeling strong');

        expect(result.injuryDetected).toBe(false);
      });

      it('should return no injury for unrelated notes', () => {
        const result = InjuryDetectionService.analyzeNotes('Had a good breakfast and ready to train');

        expect(result.injuryDetected).toBe(false);
        expect(result.description).toContain('No injury indicators');
      });
    });

    describe('Injury detected - Shoulder', () => {
      it('should detect shoulder pain', () => {
        const result = InjuryDetectionService.analyzeNotes('My shoulder hurts when I lift overhead');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
        expect(result.keywords).toContain('hurts');
        expect(result.confidence).toBeGreaterThan(0.5);
      });

      it('should detect shoulder strain', () => {
        const result = InjuryDetectionService.analyzeNotes('Strained my shoulder during bench press');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
        expect(result.injuryType).toBe('strain');
        expect(result.keywords).toContain('strained');
      });

      it('should detect shoulder impingement', () => {
        const result = InjuryDetectionService.analyzeNotes('Shoulder impingement acting up again');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
        expect(result.injuryType).toBe('impingement');
      });

      it('should classify shoulder injury severity', () => {
        const mild = InjuryDetectionService.analyzeNotes('Slight shoulder discomfort');
        expect(mild.severity).toBe('mild');

        const moderate = InjuryDetectionService.analyzeNotes('Shoulder pain is limiting my range of motion');
        expect(moderate.severity).toBe('moderate');

        const severe = InjuryDetectionService.analyzeNotes('Sharp shoulder pain, cannot lift arm');
        expect(severe.severity).toBe('severe');
      });
    });

    describe('Injury detected - Knee', () => {
      it('should detect knee pain', () => {
        const result = InjuryDetectionService.analyzeNotes('Knee is bothering me during squats');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('knee');
        expect(result.keywords).toContain('bothering');
      });

      it('should detect knee tendinitis', () => {
        const result = InjuryDetectionService.analyzeNotes('Dealing with patellar tendinitis');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('knee');
        expect(result.injuryType).toBe('tendinitis');
      });

      it('should detect knee clicking', () => {
        const result = InjuryDetectionService.analyzeNotes('My knee keeps clicking when I squat');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('knee');
        expect(result.keywords).toContain('clicking');
      });
    });

    describe('Injury detected - Lower Back', () => {
      it('should detect lower back pain', () => {
        const result = InjuryDetectionService.analyzeNotes('Lower back is tight and painful');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('lower_back');
        expect(result.keywords).toContain('painful');
      });

      it('should detect back spasm', () => {
        const result = InjuryDetectionService.analyzeNotes('Back went into spasm during deadlifts');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('lower_back');
        expect(result.injuryType).toBe('spasm');
      });

      it('should detect herniated disc', () => {
        const result = InjuryDetectionService.analyzeNotes('Herniated disc flaring up');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('lower_back');
        expect(result.injuryType).toBe('herniated_disc');
      });
    });

    describe('Injury detected - Other body parts', () => {
      it('should detect elbow pain', () => {
        const result = InjuryDetectionService.analyzeNotes('Elbow hurts during curls');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('elbow');
      });

      it('should detect wrist pain', () => {
        const result = InjuryDetectionService.analyzeNotes('Wrist is sore from push-ups');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('wrist');
      });

      it('should detect hip pain', () => {
        const result = InjuryDetectionService.analyzeNotes('Hip flexor is tight and painful');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('hip');
      });

      it('should detect ankle pain', () => {
        const result = InjuryDetectionService.analyzeNotes('Ankle is swollen after running');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('ankle');
      });

      it('should detect hamstring injury', () => {
        const result = InjuryDetectionService.analyzeNotes('Pulled my hamstring during sprints');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('hamstrings');
        expect(result.keywords).toContain('pulled');
      });
    });

    describe('Confidence scoring', () => {
      it('should have high confidence for clear injury with body part and severity', () => {
        const result = InjuryDetectionService.analyzeNotes('Sharp shoulder pain, cannot lift overhead');

        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should have moderate confidence for injury with body part but vague severity', () => {
        const result = InjuryDetectionService.analyzeNotes('Shoulder is bothering me a bit');

        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.confidence).toBeLessThan(0.8);
      });

      it('should have lower confidence for injury without clear body part', () => {
        const result = InjuryDetectionService.analyzeNotes('Something hurts but not sure what');

        expect(result.confidence).toBeLessThan(0.6);
      });
    });

    describe('Multiple keywords', () => {
      it('should detect multiple injury indicators', () => {
        const result = InjuryDetectionService.analyzeNotes('Shoulder is swollen, painful, and clicking');

        expect(result.injuryDetected).toBe(true);
        expect(result.keywords.length).toBeGreaterThan(2);
        expect(result.keywords).toContain('swollen');
        expect(result.keywords).toContain('painful');
        expect(result.keywords).toContain('clicking');
      });

      it('should increase confidence with multiple keywords', () => {
        const single = InjuryDetectionService.analyzeNotes('Shoulder hurts');
        const multiple = InjuryDetectionService.analyzeNotes('Shoulder is swollen, painful, and clicking');

        expect(multiple.confidence).toBeGreaterThan(single.confidence);
      });
    });

    describe('Description generation', () => {
      it('should generate description with body part and severity', () => {
        const result = InjuryDetectionService.analyzeNotes('Sharp shoulder pain');

        expect(result.description).toContain('shoulder');
        expect(result.description).toContain('severe');
      });

      it('should generate description with injury type', () => {
        const result = InjuryDetectionService.analyzeNotes('Shoulder strain from bench press');

        expect(result.description).toContain('strain');
      });

      it('should handle missing body part gracefully', () => {
        const result = InjuryDetectionService.analyzeNotes('Something hurts really bad');

        expect(result.description).toBeTruthy();
        expect(result.description.length).toBeGreaterThan(0);
      });
    });

    describe('Real-world scenarios', () => {
      it('should detect severe acute ankle sprain from sport context', () => {
        const result = InjuryDetectionService.analyzeNotes('Rolled my ankle playing basketball yesterday. Ankle is swollen and I had to stop the workout.');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('ankle');
        expect(result.severity).toBe('severe');
        expect(result.confidence).toBeGreaterThan(0.8);
      });

      it('should detect moderate chronic running-related knee issue', () => {
        const result = InjuryDetectionService.analyzeNotes('Knee pain has been getting worse over the last few weeks when I run.');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('knee');
        expect(result.severity).toBe('moderate');
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should detect plantar fasciitis style foot pain as moderate', () => {
        const result = InjuryDetectionService.analyzeNotes('Heel and arch pain first thing in the morning, plantar fasciitis flaring up again from running.');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('foot');
        expect(result.severity).toBe('moderate');
      });
    });


    describe('Edge cases', () => {
      it('should handle very long notes', () => {
        const longNotes = 'My shoulder has been hurting for a while now. '.repeat(50);
        const result = InjuryDetectionService.analyzeNotes(longNotes);

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
      });

      it('should handle mixed case notes', () => {
        const result = InjuryDetectionService.analyzeNotes('My SHOULDER HURTS when I LIFT');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
      });

      it('should handle notes with special characters', () => {
        const result = InjuryDetectionService.analyzeNotes('Shoulder pain!!! Can\'t lift... :(');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
      });

      it('should handle notes with numbers', () => {
        const result = InjuryDetectionService.analyzeNotes('Shoulder pain 8/10 severity');

        expect(result.injuryDetected).toBe(true);
        expect(result.bodyPart).toBe('shoulder');
      });
    });
  });
});

