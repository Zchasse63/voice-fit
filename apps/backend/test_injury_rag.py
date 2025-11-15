"""
Test script for Injury Detection RAG Service

Tests the new Grok 4 Fast Reasoning + Upstash Search RAG pipeline
for injury detection.

Usage:
    python test_injury_rag.py
"""

import asyncio

from injury_detection_rag_service import InjuryDetectionRAGService


def test_injury_detection():
    """Test injury detection with various scenarios"""

    print("=" * 80)
    print("INJURY DETECTION RAG SERVICE TEST")
    print("=" * 80)
    print()

    # Initialize service
    print("Initializing Injury Detection RAG Service...")
    try:
        service = InjuryDetectionRAGService()
        print("✅ Service initialized successfully\n")
    except Exception as e:
        print(f"❌ Failed to initialize service: {e}")
        return

    # Test cases
    test_cases = [
        {
            "name": "Shoulder Strain",
            "notes": "Strained my shoulder during bench press yesterday. Sharp pain when I lift my arm overhead.",
            "user_context": {
                "experience_level": "intermediate",
                "recent_workouts": "Bench press, overhead press, pull-ups",
                "pain_level": 6,
            },
        },
        {
            "name": "Lower Back Pain",
            "notes": "Lower back has been aching for the past week. Started after heavy deadlifts. Pain is dull and constant.",
            "user_context": {
                "experience_level": "advanced",
                "recent_workouts": "Deadlifts, squats, RDLs",
                "pain_level": 5,
            },
        },
        {
            "name": "Knee Issues",
            "notes": "My knee is clicking and popping during squats. No sharp pain but feels unstable.",
            "user_context": {
                "experience_level": "beginner",
                "recent_workouts": "Squats, leg press, lunges",
                "pain_level": 3,
            },
        },
        {
            "name": "Normal DOMS (Should NOT detect injury)",
            "notes": "Legs are super sore from yesterday's workout. That good kind of burn. Feels great!",
            "user_context": {
                "experience_level": "intermediate",
                "recent_workouts": "Heavy squats and leg press",
                "pain_level": 2,
            },
        },
    ]

    # Run tests
    for i, test_case in enumerate(test_cases, 1):
        print(f"{'=' * 80}")
        print(f"TEST {i}: {test_case['name']}")
        print(f"{'=' * 80}")
        print(f"Notes: {test_case['notes']}")
        print(f"User Context: {test_case['user_context']}")
        print()

        try:
            # Analyze injury
            print("Analyzing with Grok 4 Fast Reasoning + RAG...")
            analysis, metadata = service.analyze_injury(
                notes=test_case["notes"], user_context=test_case["user_context"]
            )

            # Display results
            print("\n📊 RESULTS:")
            print("-" * 80)
            print(
                f"Injury Detected: {'✅ YES' if analysis['injury_detected'] else '❌ NO'}"
            )
            print(f"Confidence: {analysis['confidence']:.2%}")

            if analysis["injury_detected"]:
                print(f"Body Part: {analysis.get('body_part', 'Not specified')}")
                print(f"Injury Type: {analysis.get('injury_type', 'Not specified')}")
                print(f"Severity: {analysis.get('severity', 'Not specified')}")
                print(
                    f"Should See Doctor: {'⚠️ YES' if analysis.get('should_see_doctor') else 'No'}"
                )
                print(f"\nDescription:")
                print(f"  {analysis.get('description', 'N/A')}")

                if analysis.get("red_flags"):
                    print(f"\n🚩 Red Flags:")
                    for flag in analysis["red_flags"]:
                        print(f"  • {flag}")

                if analysis.get("recommendations"):
                    print(f"\n💡 Recommendations:")
                    for rec in analysis["recommendations"][:3]:  # Show first 3
                        print(f"  • {rec}")

                if analysis.get("exercise_modifications"):
                    print(f"\n🏋️ Exercise Modifications:")
                    for mod in analysis["exercise_modifications"][:3]:  # Show first 3
                        print(f"  • {mod}")

                if analysis.get("recovery_timeline"):
                    print(f"\n⏱️ Recovery Timeline: {analysis['recovery_timeline']}")

            print(f"\n📈 METADATA:")
            print("-" * 80)
            print(f"Namespaces Searched: {', '.join(metadata['namespaces_searched'])}")
            print(f"Sources Used: {', '.join(metadata['sources_used'])}")
            print(f"Retrieval Latency: {metadata['retrieval_latency_ms']:.2f}ms")
            print(f"Inference Latency: {metadata['inference_latency_ms']:.2f}ms")
            print(f"Total Latency: {metadata['total_latency_ms']:.2f}ms")
            print(f"Model: {metadata['model_used']}")
            print(f"RAG Enabled: {metadata['rag_enabled']}")

            print(f"\n✅ Test {i} completed successfully")

        except Exception as e:
            print(f"\n❌ Test {i} failed: {e}")
            import traceback

            traceback.print_exc()

        print()

    print("=" * 80)
    print("ALL TESTS COMPLETED")
    print("=" * 80)


if __name__ == "__main__":
    test_injury_detection()
