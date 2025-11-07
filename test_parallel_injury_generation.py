#!/usr/bin/env python3
"""
Test Parallel API for Injury Analysis Training Data Generation

This script generates 50 injury analysis examples using the Parallel Deep Research API
to estimate costs and evaluate output quality before committing to full 825 example generation.

Cost Estimate:
- 50 examples × $0.025 (core processor) = $1.25
- 50 examples × $0.01 (base processor) = $0.50
- 50 examples × $0.005 (lite processor) = $0.25

Author: VoiceFit Development Team
Date: 2025-11-07
"""

import sys
import os
import json
from datetime import datetime
from typing import List, Dict, Any

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend'))

from parallel_research import ParallelResearchService


# Sample injury scenarios from the refined prompt (50 examples across all categories)
INJURY_SCENARIOS = [
    # Acute Injuries (10 examples)
    {
        "category": "acute",
        "user_input": "Sharp pain in shoulder during overhead press, felt something pop",
        "context": {"exercise": "overhead press", "severity": "severe", "mechanism": "sudden_pop"}
    },
    {
        "category": "acute",
        "user_input": "Knee buckled during heavy squat, sharp pain on inside",
        "context": {"exercise": "squat", "severity": "severe", "mechanism": "buckling"}
    },
    {
        "category": "acute",
        "user_input": "Sudden burning in lower back halfway through deadlift set",
        "context": {"exercise": "deadlift", "severity": "moderate", "mechanism": "sudden_onset"}
    },
    {
        "category": "acute",
        "user_input": "Felt a pop in my hamstring during Romanian deadlifts",
        "context": {"exercise": "RDL", "severity": "severe", "mechanism": "pop"}
    },
    {
        "category": "acute",
        "user_input": "Sharp stabbing pain in wrist during bench press",
        "context": {"exercise": "bench press", "severity": "moderate", "mechanism": "sudden_pain"}
    },
    {
        "category": "acute",
        "user_input": "Ankle rolled during box jumps, immediate swelling",
        "context": {"exercise": "box jumps", "severity": "severe", "mechanism": "rolling"}
    },
    {
        "category": "acute",
        "user_input": "Heard a crack in my elbow during dips, now can't straighten it",
        "context": {"exercise": "dips", "severity": "severe", "mechanism": "crack"}
    },
    {
        "category": "acute",
        "user_input": "Sharp pain in groin during heavy squats, felt a pull",
        "context": {"exercise": "squat", "severity": "moderate", "mechanism": "pull"}
    },
    {
        "category": "acute",
        "user_input": "Sudden sharp pain in calf during sprints",
        "context": {"exercise": "sprints", "severity": "moderate", "mechanism": "sudden_pain"}
    },
    {
        "category": "acute",
        "user_input": "Neck seized up during overhead press, can't turn head",
        "context": {"exercise": "overhead press", "severity": "severe", "mechanism": "seizing"}
    },
    
    # Chronic/Overuse (15 examples)
    {
        "category": "chronic",
        "user_input": "Elbow has been achy for 3 weeks, worse after curls and tricep work",
        "context": {"duration_weeks": 3, "exercises": ["curls", "tricep extensions"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Lower back stiff every morning, especially after heavy squat days",
        "context": {"duration_weeks": 4, "exercises": ["squats"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Shoulder hurts during bench press, started 2 weeks ago gradually",
        "context": {"duration_weeks": 2, "exercises": ["bench press"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Knee pain when going down stairs, been getting worse for a month",
        "context": {"duration_weeks": 4, "exercises": ["stairs", "squats"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Wrist aches after every upper body workout for past 6 weeks",
        "context": {"duration_weeks": 6, "exercises": ["pressing", "pulling"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Hip flexor tight and painful, especially after deadlifts",
        "context": {"duration_weeks": 3, "exercises": ["deadlifts"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Forearm pain during pull-ups, been building for 2 weeks",
        "context": {"duration_weeks": 2, "exercises": ["pull-ups"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Lower back feels tight and achy after every squat session",
        "context": {"duration_weeks": 5, "exercises": ["squats"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Shoulder clicks during overhead movements, no pain but annoying",
        "context": {"duration_weeks": 8, "exercises": ["overhead press"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Knee feels unstable during lunges, started 3 weeks ago",
        "context": {"duration_weeks": 3, "exercises": ["lunges"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Elbow pain during bench press, worse with heavy weight",
        "context": {"duration_weeks": 4, "exercises": ["bench press"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Hip pinches at bottom of squat, been happening for 2 months",
        "context": {"duration_weeks": 8, "exercises": ["squats"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Shoulder pain during dips, gradually getting worse",
        "context": {"duration_weeks": 3, "exercises": ["dips"], "severity": "mild"}
    },
    {
        "category": "chronic",
        "user_input": "Lower back pain after deadlifts, been consistent for 6 weeks",
        "context": {"duration_weeks": 6, "exercises": ["deadlifts"], "severity": "moderate"}
    },
    {
        "category": "chronic",
        "user_input": "Knee pain during leg extensions, started a month ago",
        "context": {"duration_weeks": 4, "exercises": ["leg extensions"], "severity": "mild"}
    },
    
    # Tendinitis/Tendinopathy (10 examples)
    {
        "category": "tendinitis",
        "user_input": "Achilles tendon pain when running, fine during warm-up but worse next day",
        "context": {"location": "achilles", "exercises": ["running"], "severity": "moderate"}
    },
    {
        "category": "tendinitis",
        "user_input": "Pain on outside of elbow during pull-ups, especially last few reps",
        "context": {"location": "lateral_elbow", "exercises": ["pull-ups"], "severity": "mild"}
    },
    {
        "category": "tendinitis",
        "user_input": "Patellar tendon hurts during squats, particularly in bottom position",
        "context": {"location": "patellar", "exercises": ["squats"], "severity": "moderate"}
    },
    {
        "category": "tendinitis",
        "user_input": "Bicep tendon pain at shoulder during curls",
        "context": {"location": "bicep_tendon", "exercises": ["curls"], "severity": "mild"}
    },
    {
        "category": "tendinitis",
        "user_input": "Golfer's elbow pain during deadlifts and rows",
        "context": {"location": "medial_elbow", "exercises": ["deadlifts", "rows"], "severity": "moderate"}
    },
    {
        "category": "tendinitis",
        "user_input": "Rotator cuff pain during overhead press, worse at night",
        "context": {"location": "rotator_cuff", "exercises": ["overhead press"], "severity": "moderate"}
    },
    {
        "category": "tendinitis",
        "user_input": "Hamstring tendon pain at sit bone during deadlifts",
        "context": {"location": "hamstring_insertion", "exercises": ["deadlifts"], "severity": "mild"}
    },
    {
        "category": "tendinitis",
        "user_input": "Wrist tendon pain during bench press and push-ups",
        "context": {"location": "wrist", "exercises": ["bench press", "push-ups"], "severity": "mild"}
    },
    {
        "category": "tendinitis",
        "user_input": "Quad tendon pain above kneecap during squats",
        "context": {"location": "quad_tendon", "exercises": ["squats"], "severity": "moderate"}
    },
    {
        "category": "tendinitis",
        "user_input": "Plantar fascia pain in heel, worse in morning",
        "context": {"location": "plantar_fascia", "exercises": ["running", "jumping"], "severity": "moderate"}
    },
    
    # False Positives - DOMS (10 examples)
    {
        "category": "doms",
        "user_input": "My legs are really sore 2 days after squats",
        "context": {"timing": "48_hours_post", "bilateral": True, "severity": "mild"}
    },
    {
        "category": "doms",
        "user_input": "Chest feels tight and achy day after bench press",
        "context": {"timing": "24_hours_post", "bilateral": True, "severity": "mild"}
    },
    {
        "category": "doms",
        "user_input": "Glutes are killing me after deadlifts yesterday",
        "context": {"timing": "24_hours_post", "bilateral": True, "severity": "moderate"}
    },
    {
        "category": "doms",
        "user_input": "Arms are super sore 2 days after arm day",
        "context": {"timing": "48_hours_post", "bilateral": True, "severity": "mild"}
    },
    {
        "category": "doms",
        "user_input": "Whole body aches after full body workout yesterday",
        "context": {"timing": "24_hours_post", "bilateral": True, "severity": "moderate"}
    },
    {
        "category": "doms",
        "user_input": "Hamstrings are tight and sore after RDLs 2 days ago",
        "context": {"timing": "48_hours_post", "bilateral": True, "severity": "mild"}
    },
    {
        "category": "doms",
        "user_input": "Shoulders feel heavy and achy day after overhead press",
        "context": {"timing": "24_hours_post", "bilateral": True, "severity": "mild"}
    },
    {
        "category": "doms",
        "user_input": "Back is sore all over after deadlift session",
        "context": {"timing": "24_hours_post", "bilateral": True, "severity": "mild"}
    },
    {
        "category": "doms",
        "user_input": "Quads are burning 2 days after leg day",
        "context": {"timing": "48_hours_post", "bilateral": True, "severity": "moderate"}
    },
    {
        "category": "doms",
        "user_input": "Lats are super tight and sore after pull day",
        "context": {"timing": "24_hours_post", "bilateral": True, "severity": "mild"}
    },
    
    # Ambiguous Cases (5 examples)
    {
        "category": "ambiguous",
        "user_input": "My knee hurts sometimes",
        "context": {"vague": True, "insufficient_info": True}
    },
    {
        "category": "ambiguous",
        "user_input": "I have some shoulder pain",
        "context": {"vague": True, "insufficient_info": True}
    },
    {
        "category": "ambiguous",
        "user_input": "My back feels weird",
        "context": {"vague": True, "insufficient_info": True}
    },
    {
        "category": "ambiguous",
        "user_input": "Something doesn't feel right in my hip",
        "context": {"vague": True, "insufficient_info": True}
    },
    {
        "category": "ambiguous",
        "user_input": "I think I might have hurt my elbow",
        "context": {"vague": True, "insufficient_info": True}
    },
]


def generate_injury_analysis_example(
    service: ParallelResearchService,
    scenario: Dict[str, Any],
    processor: str = "core"
) -> Dict[str, Any]:
    """
    Generate a single injury analysis training example using Parallel API.
    
    Args:
        service: ParallelResearchService instance
        scenario: Injury scenario dict with user_input, category, and context
        processor: Processor tier to use (lite/base/core/ultra)
    
    Returns:
        Dict containing the training example with reasoning chains
    """
    
    # Build research query
    query = f"""
    Generate a comprehensive injury analysis training example for Llama 3.3 70B fine-tuning.
    
    USER INPUT: "{scenario['user_input']}"
    CATEGORY: {scenario['category']}
    CONTEXT: {json.dumps(scenario['context'])}
    
    Generate a complete training example with:
    1. Reasoning chain showing HOW the model analyzes the injury
    2. Differential diagnosis with confidence scores
    3. Specific exercise modifications (avoid/substitute pairs with load percentages)
    4. Recovery timeline with phase-based checkpoints
    5. Red flags requiring medical attention
    6. Confidence reasoning explaining the confidence level
    
    Format as a JSON training example suitable for Llama 3.3 70B fine-tuning.
    """
    
    # Define schema for structured output
    schema = {
        "type": "object",
        "properties": {
            "user_input": {"type": "string"},
            "reasoning_chain": {
                "type": "array",
                "items": {"type": "string"}
            },
            "differential_diagnosis": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "condition": {"type": "string"},
                        "probability": {"type": "number"},
                        "reasoning": {"type": "string"}
                    }
                }
            },
            "primary_assessment": {
                "type": "object",
                "properties": {
                    "injury_type": {"type": "string"},
                    "severity": {"type": "string"},
                    "confidence": {"type": "number"},
                    "confidence_reasoning": {"type": "string"}
                }
            },
            "exercise_modifications": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "avoid": {"type": "string"},
                        "substitute": {"type": "string"},
                        "load_adjustment": {"type": "string"},
                        "sets_reps": {"type": "string"},
                        "progression_criteria": {"type": "string"}
                    }
                }
            },
            "recovery_timeline": {
                "type": "object",
                "properties": {
                    "total_weeks": {"type": "number"},
                    "phases": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "phase_name": {"type": "string"},
                                "duration_weeks": {"type": "number"},
                                "goals": {"type": "array", "items": {"type": "string"}},
                                "checkpoints": {"type": "array", "items": {"type": "string"}}
                            }
                        }
                    }
                }
            },
            "red_flags": {
                "type": "array",
                "items": {"type": "string"}
            }
        }
    }
    
    # Execute research
    result = service._execute_research(
        query=query,
        schema=schema,
        processor=processor,
        use_cache=True
    )
    
    return {
        "scenario": scenario,
        "training_example": result['content'],
        "citations": result.get('basis', []),
        "processor_used": processor
    }


def main():
    """
    Main function to generate 50 injury analysis examples and estimate costs.
    """
    print("\n" + "="*80)
    print("PARALLEL API TEST: Injury Analysis Training Data Generation")
    print("="*80)
    
    # Initialize service
    service = ParallelResearchService()
    
    # Test with different processors
    processors_to_test = ["lite", "base", "core"]
    processor_costs = {
        "lite": 0.005,
        "base": 0.01,
        "core": 0.025
    }
    
    print("\nTest Configuration:")
    print(f"  Total scenarios: {len(INJURY_SCENARIOS)}")
    print(f"  Processors to test: {', '.join(processors_to_test)}")
    print(f"\nEstimated costs:")
    for proc in processors_to_test:
        cost = len(INJURY_SCENARIOS) * processor_costs[proc]
        print(f"  {proc}: ${cost:.2f} ({len(INJURY_SCENARIOS)} × ${processor_costs[proc]})")
    
    # Ask user which processor to use
    print("\nWhich processor would you like to test?")
    print("  1. lite ($0.25 total)")
    print("  2. base ($0.50 total)")
    print("  3. core ($1.25 total) - RECOMMENDED")
    print("  4. Test all three (will cost $2.00 total)")
    
    choice = input("\nEnter your choice (1-4): ").strip()
    
    if choice == "1":
        selected_processors = ["lite"]
    elif choice == "2":
        selected_processors = ["base"]
    elif choice == "3":
        selected_processors = ["core"]
    elif choice == "4":
        selected_processors = processors_to_test
    else:
        print("Invalid choice. Exiting.")
        return
    
    # Generate examples
    all_results = {}
    
    for processor in selected_processors:
        print(f"\n{'='*80}")
        print(f"Generating examples with {processor.upper()} processor...")
        print(f"{'='*80}\n")
        
        results = []
        total_cost = len(INJURY_SCENARIOS) * processor_costs[processor]
        
        print(f"Processing {len(INJURY_SCENARIOS)} scenarios...")
        print(f"Estimated cost: ${total_cost:.2f}\n")
        
        for i, scenario in enumerate(INJURY_SCENARIOS, 1):
            print(f"[{i}/{len(INJURY_SCENARIOS)}] {scenario['category']}: {scenario['user_input'][:60]}...")
            
            try:
                result = generate_injury_analysis_example(service, scenario, processor)
                results.append(result)
                print(f"  ✅ Complete")
            except Exception as e:
                print(f"  ❌ Error: {str(e)}")
                results.append({
                    "scenario": scenario,
                    "error": str(e),
                    "processor_used": processor
                })
        
        all_results[processor] = results
        
        # Save results
        filename = f"injury_analysis_test_{processor}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n✅ {processor.upper()} results saved to: {filename}")
        print(f"💰 Actual cost: ${total_cost:.2f}")
    
    # Summary
    print("\n" + "="*80)
    print("TEST COMPLETE - SUMMARY")
    print("="*80)
    
    total_spent = sum(len(INJURY_SCENARIOS) * processor_costs[p] for p in selected_processors)
    print(f"\nTotal examples generated: {len(INJURY_SCENARIOS) * len(selected_processors)}")
    print(f"Total cost: ${total_spent:.2f}")
    
    print("\nNext steps:")
    print("  1. Review the generated JSON files")
    print("  2. Evaluate quality of examples")
    print("  3. Compare processor tiers (if you tested multiple)")
    print("  4. Decide which processor to use for full 825 example generation")
    print(f"\nFull generation cost estimates (825 examples):")
    for proc in processors_to_test:
        full_cost = 825 * processor_costs[proc]
        print(f"  {proc}: ${full_cost:.2f}")


if __name__ == "__main__":
    main()

