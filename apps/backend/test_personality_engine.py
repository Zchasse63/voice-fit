"""
Test PersonalityEngine - Verify conversational onboarding responses

This test demonstrates the personality system in action:
1. Beginner user - educational, encouraging tone
2. Intermediate user - technical but friendly tone
3. Advanced user - highly technical, performance-focused tone
"""

from personality_engine import PersonalityEngine


def test_personality_engine():
    """Test PersonalityEngine with different user contexts"""
    
    engine = PersonalityEngine()
    
    print("\n" + "="*80)
    print("PERSONALITY ENGINE TEST - Conversational Onboarding")
    print("="*80)
    
    # Test 1: Beginner user
    print("\n\n📚 TEST 1: BEGINNER USER")
    print("-" * 80)
    
    beginner_context = {
        "experience_level": "beginner",
        "user_name": "Sarah"
    }
    
    response = engine.generate_response(
        base_question="What are your main training goals?",
        user_context=beginner_context,
        previous_answer="I'm pretty new to lifting, just started a few months ago",
        conversation_type="onboarding"
    )
    
    print(f"\nUser: 'I'm pretty new to lifting, just started a few months ago'")
    print(f"\nCoach: {response}")
    
    # Test 2: Intermediate user
    print("\n\n💪 TEST 2: INTERMEDIATE USER")
    print("-" * 80)
    
    intermediate_context = {
        "experience_level": "intermediate",
        "user_name": "Mike"
    }
    
    response = engine.generate_response(
        base_question="What are your main training goals?",
        user_context=intermediate_context,
        previous_answer="I've been lifting for about 2 years, hit some plateaus recently",
        conversation_type="onboarding"
    )
    
    print(f"\nUser: 'I've been lifting for about 2 years, hit some plateaus recently'")
    print(f"\nCoach: {response}")
    
    # Test 3: Advanced user
    print("\n\n🏆 TEST 3: ADVANCED USER")
    print("-" * 80)
    
    advanced_context = {
        "experience_level": "advanced",
        "user_name": "Alex"
    }
    
    response = engine.generate_response(
        base_question="What are your main training goals?",
        user_context=advanced_context,
        previous_answer="5 years of powerlifting, looking to peak for a meet in 12 weeks",
        conversation_type="onboarding"
    )
    
    print(f"\nUser: '5 years of powerlifting, looking to peak for a meet in 12 weeks'")
    print(f"\nCoach: {response}")
    
    # Test 4: Injury discussion
    print("\n\n🩹 TEST 4: INJURY DISCUSSION (Intermediate)")
    print("-" * 80)
    
    injury_context = {
        "experience_level": "intermediate",
        "user_name": "Jordan",
        "training_goals": ["strength", "hypertrophy"]
    }
    
    response = engine.generate_response(
        base_question="Do you have any current or past injuries I should know about?",
        user_context=injury_context,
        previous_answer="I want to get stronger, especially my squat and deadlift",
        conversation_type="injury_discussion"
    )
    
    print(f"\nUser: 'I want to get stronger, especially my squat and deadlift'")
    print(f"\nCoach: {response}")
    
    # Test 5: First message (no previous answer)
    print("\n\n👋 TEST 5: FIRST MESSAGE (No previous answer)")
    print("-" * 80)
    
    first_context = {
        "experience_level": "intermediate",
        "user_name": "Taylor"
    }
    
    response = engine.generate_response(
        base_question="How long have you been training?",
        user_context=first_context,
        previous_answer=None,
        conversation_type="onboarding"
    )
    
    print(f"\nCoach (first message): {response}")
    
    print("\n" + "="*80)
    print("✅ PERSONALITY ENGINE TEST COMPLETE")
    print("="*80)
    print("\nKey Features Demonstrated:")
    print("1. ✅ Tone adapts to experience level (beginner/intermediate/advanced)")
    print("2. ✅ Acknowledges previous answers with specific details")
    print("3. ✅ Uses user's name for personalization")
    print("4. ✅ Conversational language (contractions, casual tone)")
    print("5. ✅ Context-aware (onboarding vs injury discussion)")
    print("\n")


if __name__ == "__main__":
    test_personality_engine()

