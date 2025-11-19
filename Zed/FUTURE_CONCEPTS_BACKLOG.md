# Future Concepts Backlog

This document contains advanced features and concepts that are currently deferred for future research and implementation.

## Video Form Analysis

**Goal:** Use computer vision to analyze exercise form and flag potential issues

### Form Quality Scoring
```json
{
  "exercise": "Barbell Squat",
  "form_score": 7.2,
  "issues_detected": [
    {
      "issue": "knee_valgus",
      "severity": "moderate",
      "timestamp": "0:03",
      "recommendation": "Focus on pushing knees out, add hip abduction work"
    },
    {
      "issue": "forward_lean",
      "severity": "minor",
      "timestamp": "0:05",
      "recommendation": "Improve ankle mobility, try elevated heels"
    }
  ],
  "substitute_suggested": "Goblet Squat",
  "reason": "Build better movement patterns before loading heavy"
}
```

**Features:**
- [ ] Record sets with phone camera (front/side view)
- [ ] ML model detects joint angles, bar path, tempo
- [ ] Flags form breakdowns (knee valgus, butt wink, forward lean)
- [ ] Suggests corrective exercises or regressions
- [ ] Tracks form improvement over time
- [ ] Automatically swap to easier variation if form is consistently poor

**Use Cases:**
- User's squat depth decreases over sets → AI suggests ending set early
- Knee valgus detected → Flag potential knee injury risk, suggest glute work
- Bar path shifts forward on bench press → Suggest form cues or lighter weight
- Consistent form issues → Recommend video coaching session

**Technical Requirements:**
- MediaPipe or similar pose estimation library
- On-device processing (privacy)
- Custom ML model trained on exercise form datasets
- Low-latency processing (<2 seconds per set)

**Estimated Timeline:** 10-12 weeks (complex ML work)
**Dependencies:** ML expertise, large dataset of exercise videos with annotations

---

## Additional Advanced Personalization Ideas

### Genetic Profiling (Future: 12+ months)
- [ ] Integrate DNA test results (23andMe, AncestryDNA)
- [ ] Tailor nutrition/training to genetic markers (ACTN3, ACE, etc.)
- [ ] Predict injury susceptibility based on genetic factors

### Behavioral AI (Future: 9-12 months)
- [ ] ML model learns user preferences over time
- [ ] Predicts which substitutes user will prefer
- [ ] Adapts communication style based on engagement patterns
- [ ] Proactively suggests workouts user will enjoy

### Social Comparison (Future: 6-9 months)
- [ ] "Users like you prefer these substitutes"
- [ ] Compare performance to similar athletes (age, weight, experience)
- [ ] Leaderboards for specific exercises
- [ ] Anonymous benchmarking data
