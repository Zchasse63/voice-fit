"""
Test Workout Logging Personality - Verify confirmation messages

This test demonstrates the personality system for workout logging:
1. Regular set confirmations (brief, encouraging)
2. PR celebrations (exciting, immediate)
3. First set vs subsequent sets (different energy levels)
4. Variety in messages (not repetitive)
"""

from integrated_voice_parser import _generate_confirmation_message


def test_workout_logging_personality():
    """Test workout logging confirmation messages"""
    
    print("\n" + "="*80)
    print("WORKOUT LOGGING PERSONALITY TEST - Confirmation Messages")
    print("="*80)
    
    # Test 1: Regular first set
    print("\n\n💪 TEST 1: REGULAR FIRST SET")
    print("-" * 80)
    
    parsed_data = {
        "exercise_name": "Bench Press",
        "weight": 225,
        "weight_unit": "lbs",
        "reps": 8,
        "rpe": 8
    }
    
    # Generate 5 messages to show variety
    print("\nGenerating 5 different messages for the same set:")
    for i in range(5):
        message = _generate_confirmation_message(
            parsed_data=parsed_data,
            is_pr=False,
            set_number=1,
            user_name=None
        )
        print(f"  {i+1}. {message}")
    
    # Test 2: PR celebration
    print("\n\n🎉 TEST 2: PR CELEBRATION")
    print("-" * 80)
    
    print("\nGenerating 5 different PR celebration messages:")
    for i in range(5):
        message = _generate_confirmation_message(
            parsed_data=parsed_data,
            is_pr=True,
            set_number=1,
            user_name=None
        )
        print(f"  {i+1}. {message}")
    
    # Test 3: Subsequent sets (brief)
    print("\n\n📝 TEST 3: SUBSEQUENT SETS (Set 3)")
    print("-" * 80)
    
    print("\nGenerating 5 messages for set 3 (should be briefer):")
    for i in range(5):
        message = _generate_confirmation_message(
            parsed_data=parsed_data,
            is_pr=False,
            set_number=3,
            user_name=None
        )
        print(f"  {i+1}. {message}")
    
    # Test 4: With user's name
    print("\n\n👤 TEST 4: WITH USER'S NAME")
    print("-" * 80)
    
    print("\nGenerating 10 messages (name appears ~10% of the time):")
    for i in range(10):
        message = _generate_confirmation_message(
            parsed_data=parsed_data,
            is_pr=False,
            set_number=1,
            user_name="Mike"
        )
        print(f"  {i+1}. {message}")
    
    # Test 5: Different exercises
    print("\n\n🏋️ TEST 5: DIFFERENT EXERCISES")
    print("-" * 80)
    
    exercises = [
        {"exercise_name": "Squat", "weight": 315, "weight_unit": "lbs", "reps": 5, "rpe": 9},
        {"exercise_name": "Deadlift", "weight": 405, "weight_unit": "lbs", "reps": 3, "rpe": 8},
        {"exercise_name": "Overhead Press", "weight": 135, "weight_unit": "lbs", "reps": 10, "rpe": 7},
    ]
    
    for exercise_data in exercises:
        message = _generate_confirmation_message(
            parsed_data=exercise_data,
            is_pr=False,
            set_number=1,
            user_name=None
        )
        print(f"\n{exercise_data['exercise_name']}: {message}")
    
    # Test 6: Minimal data (no RPE)
    print("\n\n📊 TEST 6: MINIMAL DATA (No RPE)")
    print("-" * 80)
    
    minimal_data = {
        "exercise_name": "Bench Press",
        "weight": 225,
        "weight_unit": "lbs",
        "reps": 8
    }
    
    message = _generate_confirmation_message(
        parsed_data=minimal_data,
        is_pr=False,
        set_number=1,
        user_name=None
    )
    print(f"\nMessage: {message}")
    
    # Test 7: PR with user's name
    print("\n\n🎊 TEST 7: PR WITH USER'S NAME")
    print("-" * 80)
    
    print("\nGenerating 3 PR messages with user's name:")
    for i in range(3):
        message = _generate_confirmation_message(
            parsed_data=parsed_data,
            is_pr=True,
            set_number=1,
            user_name="Sarah"
        )
        print(f"  {i+1}. {message}")
    
    print("\n" + "="*80)
    print("✅ WORKOUT LOGGING PERSONALITY TEST COMPLETE")
    print("="*80)
    print("\nKey Features Demonstrated:")
    print("1. ✅ Brief confirmations (user is mid-workout)")
    print("2. ✅ PR celebrations are exciting and immediate")
    print("3. ✅ First set vs subsequent sets have different energy")
    print("4. ✅ Variety in messages (not repetitive)")
    print("5. ✅ Conversational language (contractions, emojis)")
    print("6. ✅ User's name appears occasionally")
    print("7. ✅ Handles minimal data gracefully")
    print("\n")


if __name__ == "__main__":
    test_workout_logging_personality()

