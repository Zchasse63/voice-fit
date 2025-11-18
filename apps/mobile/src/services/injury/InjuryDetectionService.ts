/**
 * InjuryDetectionService
 * 
 * NLP-based injury detection service for Free tier users.
 * Uses keyword matching from injury_keywords.json to detect potential injuries
 * in user notes from daily readiness check-ins.
 * 
 * Features:
 * - Keyword-based injury detection
 * - Body part extraction
 * - Severity classification (mild, moderate, severe)
 * - Context awareness (injury vs. normal DOMS)
 * - False positive filtering
 */

import injuryKeywords from '../../../docs/research/injury_keywords.json';

export interface InjuryDetectionResult {
  injuryDetected: boolean;
  confidence: number; // 0.0-1.0
  bodyPart: string | null;
  severity: 'mild' | 'moderate' | 'severe' | null;
  injuryType: string | null;
  description: string;
  keywords: string[]; // Matched keywords for debugging
}

export class InjuryDetectionService {
  /**
   * Analyze user notes for potential injury indicators
   * @param notes User's notes from readiness check-in
   * @returns InjuryDetectionResult with detection details
   */
  static analyzeNotes(notes: string): InjuryDetectionResult {
    if (!notes || notes.trim().length === 0) {
      return this.noInjuryResult('No notes provided');
    }

    const normalizedNotes = notes.toLowerCase();
    const matchedKeywords: string[] = [];

    // Step 1: Check for false positives (hyperbolic expressions)
    if (this.containsFalsePositives(normalizedNotes)) {
      return this.noInjuryResult('Hyperbolic expression detected (not actual injury)');
    }

    // Step 2: Check for normal training indicators (DOMS, positive context)
    if (this.containsNormalTrainingIndicators(normalizedNotes)) {
      return this.noInjuryResult('Normal training soreness (DOMS) detected');
    }

    // Step 3: Check for injury indicators
    const hasInjuryIndicators = this.containsInjuryIndicators(normalizedNotes, matchedKeywords);
    
    if (!hasInjuryIndicators) {
      return this.noInjuryResult('No injury indicators detected');
    }

    // Step 4: Extract body part
    const bodyPart = this.extractBodyPart(normalizedNotes, matchedKeywords);

    // Step 5: Classify severity
    const severity = this.classifySeverity(normalizedNotes, matchedKeywords);

    // Step 6: Identify injury type
    const injuryType = this.identifyInjuryType(normalizedNotes, matchedKeywords);

    // Step 7: Calculate confidence score
    const confidence = this.calculateConfidence(matchedKeywords, hasInjuryIndicators, bodyPart, severity);

    return {
      injuryDetected: true,
      confidence,
      bodyPart,
      severity,
      injuryType,
      description: this.generateDescription(bodyPart, severity, injuryType),
      keywords: matchedKeywords,
    };
  }

  /**
   * Check if notes contain false positive indicators (hyperbolic expressions)
   */
  private static containsFalsePositives(notes: string): boolean {
    const falsePositives = injuryKeywords.false_positives.hyperbolic_expressions;

    return falsePositives.some((phrase) => {
      // Use word boundaries for single words to avoid "deadlifts" matching "dead"
      if (!phrase.includes(" ")) {
        const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i");
        return regex.test(notes);
      }

      // For multi-word phrases, simple substring matching is sufficient
      return notes.includes(phrase);
    });
  }

  /**
   * Check if notes contain normal training indicators (DOMS, positive context)
   */
  private static containsNormalTrainingIndicators(notes: string): boolean {
    const normalIndicators = [
      ...injuryKeywords.context_clues.normal_training_indicators.positive_context,
      ...injuryKeywords.context_clues.normal_training_indicators.doms_language,
    ];
    return normalIndicators.some(phrase => notes.includes(phrase));
  }

  /**
   * Check if notes contain injury indicators
   */
  private static containsInjuryIndicators(notes: string, matchedKeywords: string[]): boolean {
    let hasIndicators = false;

    // Helper function to check for word boundary matches (avoid "breakfast" matching "break")
    const containsWord = (text: string, word: string): boolean => {
      // For single words, use word boundary regex
      if (!word.includes(' ')) {
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(text);
      }
      // For phrases, use simple includes
      return text.includes(word);
    };

    // Check pain descriptors
    Object.values(injuryKeywords.pain_descriptors).forEach(descriptors => {
      descriptors.forEach(descriptor => {
        if (containsWord(notes, descriptor)) {
          matchedKeywords.push(descriptor);
          hasIndicators = true;
        }
      });
    });

    // Check discomfort indicators (mild, moderate, severe)
    Object.values(injuryKeywords.discomfort_indicators).forEach(descriptors => {
      descriptors.forEach(descriptor => {
        if (containsWord(notes, descriptor)) {
          matchedKeywords.push(descriptor);
          hasIndicators = true;
        }
      });
    });

    // Check injury types (use word boundaries to avoid "breakfast" matching "break")
    Object.values(injuryKeywords.injury_types).forEach(types => {
      types.forEach(type => {
        if (containsWord(notes, type)) {
          matchedKeywords.push(type);
          hasIndicators = true;
        }
      });
    });

    // Check functional limitation indicators
    injuryKeywords.context_clues.injury_indicators.functional_limitation.forEach(phrase => {
      if (notes.includes(phrase)) {
        matchedKeywords.push(phrase);
        hasIndicators = true;
      }
    });

    // Check acute onset indicators
    injuryKeywords.context_clues.injury_indicators.acute_onset.forEach(phrase => {
      if (notes.includes(phrase)) {
        matchedKeywords.push(phrase);
        hasIndicators = true;
      }
    });

    return hasIndicators;
  }

  /**
   * Extract body part from notes
   * Prioritizes longer/more specific matches (e.g., "lower_back" over "back")
   */
  private static extractBodyPart(notes: string, matchedKeywords: string[]): string | null {
    // Collect all potential matches with their lengths
    const matches: Array<{ bodyPart: string; term: string; length: number }> = [];

    for (const [bodyPartKey, bodyPartData] of Object.entries(injuryKeywords.body_parts)) {
      // Check primary terms
      for (const term of bodyPartData.primary) {
        if (notes.includes(term)) {
          matches.push({ bodyPart: bodyPartKey, term, length: term.length });
        }
      }

      // Check synonyms
      for (const synonym of bodyPartData.synonyms) {
        if (notes.includes(synonym)) {
          matches.push({ bodyPart: bodyPartKey, term: synonym, length: synonym.length });
        }
      }

      // Check regions
      for (const region of bodyPartData.regions) {
        if (notes.includes(region)) {
          matches.push({ bodyPart: bodyPartKey, term: region, length: region.length });
        }
      }
    }

    // If no matches, return null
    if (matches.length === 0) {
      return null;
    }

    // Sort by term length (longest first), then by bodyPart key length
    // so that more specific regions like "lower_back" win over "back".
    matches.sort((a, b) => {
      if (b.length !== a.length) {
        return b.length - a.length;
      }
      return b.bodyPart.length - a.bodyPart.length;
    });

    // Return the most specific match
    let bestMatch = matches[0];

    // In our strength-training context, generic "back" issues are usually
    // lower-back related, so normalize "back" to "lower_back" when available.
    if (bestMatch.bodyPart === 'back' && (injuryKeywords as any).body_parts?.lower_back) {
      bestMatch = {
        ...bestMatch,
        bodyPart: 'lower_back',
      };
    }

    // Normalize singular hamstring key to plural form expected by tests/UI
    if (bestMatch.bodyPart === 'hamstring') {
      bestMatch = {
        ...bestMatch,
        bodyPart: 'hamstrings',
      };
    }

    matchedKeywords.push(bestMatch.term);
    return bestMatch.bodyPart;
  }

  /**
   * Classify severity based on keywords and context.
   *
   * This is a lightweight heuristic that mirrors, at a high level, the
   * severity guidance used in the premium Grok + RAG pipeline:
   * - Mild: minor discomfort, minimal functional impact
   * - Moderate: noticeable pain, limiting some movements
   * - Severe: significant pain with major functional limitation or red flags
   */
  private static classifySeverity(notes: string, matchedKeywords: string[]): 'mild' | 'moderate' | 'severe' | null {
    // Core severity keyword groups
    const severeIndicators = [
      ...injuryKeywords.discomfort_indicators.severe,
      ...injuryKeywords.severity_modifiers.severe,
      ...injuryKeywords.pain_descriptors.sharp_acute,
    ];
    const moderateIndicators = [
      ...injuryKeywords.discomfort_indicators.moderate,
      ...injuryKeywords.severity_modifiers.moderate,
    ];
    const mildIndicators = [
      ...injuryKeywords.discomfort_indicators.mild,
      ...injuryKeywords.severity_modifiers.minimal,
    ];

    const hasSevereIndicators = severeIndicators.some(indicator => notes.includes(indicator));
    const hasModerateIndicators = moderateIndicators.some(indicator => notes.includes(indicator));
    const hasMildIndicators = mildIndicators.some(indicator => notes.includes(indicator));

    // Context clues from injury_keywords.json
    const functionalLimitationPhrases = injuryKeywords.context_clues.injury_indicators.functional_limitation;
    const acuteOnsetPhrases = injuryKeywords.context_clues.injury_indicators.acute_onset;
    const worseningPhrases = injuryKeywords.context_clues.injury_indicators.worsening;
    const persistentPhrases = injuryKeywords.context_clues.injury_indicators.persistent;
    const objectiveSignPhrases = injuryKeywords.context_clues.injury_indicators.objective_signs;

    const hasFunctionalLimitation = functionalLimitationPhrases.some(phrase => notes.includes(phrase));
    const hasAcuteOnset = acuteOnsetPhrases.some(phrase => notes.includes(phrase));
    const hasWorsening = worseningPhrases.some(phrase => notes.includes(phrase));
    const hasPersistent = persistentPhrases.some(phrase => notes.includes(phrase));
    const hasObjectiveSigns = objectiveSignPhrases.some(phrase => notes.includes(phrase));

    // Severe: strong pain language OR clear functional limitation + objective signs/acute onset
    if (
      hasSevereIndicators ||
      (hasFunctionalLimitation && (hasSevereIndicators || hasModerateIndicators || hasObjectiveSigns || hasAcuteOnset)) ||
      (hasAcuteOnset && hasSevereIndicators) ||
      (hasObjectiveSigns && hasSevereIndicators)
    ) {
      return 'severe';
    }

    // Moderate: noticeable issues, often persistent/worsening or limiting but not clearly severe
    if (
      hasModerateIndicators ||
      ((hasMildIndicators || hasFunctionalLimitation) && (hasWorsening || hasPersistent))
    ) {
      return 'moderate';
    }

    // Mild: any remaining discomfort / limitation signals that aren't clearly moderate/severe
    if (
      hasMildIndicators ||
      hasFunctionalLimitation ||
      hasAcuteOnset ||
      hasWorsening ||
      hasPersistent ||
      hasObjectiveSigns
    ) {
      return 'mild';
    }

    // Default to mild if injury detected but no severity keywords
    return 'mild';
  }

  /**
   * Identify injury type from keywords
   */
  private static identifyInjuryType(notes: string, matchedKeywords: string[]): string | null {
    // Map specific text variants to canonical injury type identifiers
    const canonicalMap: Record<string, string> = {
      'herniated disc': 'herniated_disc',
    };

    for (const [, types] of Object.entries(injuryKeywords.injury_types)) {
      const matchedType = types.find((type) => notes.includes(type));
      if (matchedType) {
        return canonicalMap[matchedType] ?? matchedType;
      }
    }

    return null;
  }

  /**
   * Calculate confidence score based on matched keywords and context
   */
  private static calculateConfidence(
    matchedKeywords: string[],
    hasInjuryIndicators: boolean,
    bodyPart: string | null,
    severity: string | null
  ): number {
    let confidence = 0.0;

    // Base confidence from injury indicators
    if (hasInjuryIndicators) {
      confidence += 0.4;
    }

    // Boost confidence if body part identified
    if (bodyPart) {
      confidence += 0.2;
    }

    // Severity-specific boosts – mild < moderate < severe
    if (severity === 'severe') {
      confidence += 0.25;
    } else if (severity === 'moderate') {
      confidence += 0.15;
    } else if (severity === 'mild') {
      confidence += 0.05;
    }

    // Boost confidence based on number of matched keywords (caps at +0.1)
    const keywordBoost = Math.min(matchedKeywords.length * 0.03, 0.1);
    confidence += keywordBoost;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate human-readable description of detected injury
   */
  private static generateDescription(
    bodyPart: string | null,
    severity: string | null,
    injuryType: string | null
  ): string {
    if (!bodyPart && !severity && !injuryType) {
      return 'Potential training-related discomfort detected';
    }

    const parts: string[] = [];

    if (severity) {
      // Keep severity lowercase so tests can assert on exact text (e.g. "severe")
      parts.push(severity);
    }

    if (bodyPart) {
      const formattedBodyPart = bodyPart.replace(/_/g, ' ');
      parts.push(formattedBodyPart);
    }

    if (injuryType) {
      parts.push(injuryType);
    }

    return parts.join(' ');
  }

  /**
   * Helper to create a "no injury" result
   */
  private static noInjuryResult(description: string): InjuryDetectionResult {
    return {
      injuryDetected: false,
      confidence: 0.0,
      bodyPart: null,
      severity: null,
      injuryType: null,
      description,
      keywords: [],
    };
  }
}

