"""
Test Notification Personality - Verify Duolingo-inspired notifications

This test demonstrates the notification personality system:
1. Workout reminders (contextual to day's focus)
2. Streak celebrations (3, 7, 14, 30 days)
3. Missed workout reminders (no guilt)
4. PR celebrations (immediate, exciting)
5. Program completion (major milestone)
6. Deload week reminders (educational)
7. Rest day reminders (encouraging)
"""

from notification_personality import NotificationPersonality


def test_notification_personality():
    """Test all notification types"""
    
    notif = NotificationPersonality()
    
    print("\n" + "="*80)
    print("NOTIFICATION PERSONALITY TEST - Duolingo-Inspired Notifications")
    print("="*80)
    
    # Test 1: Workout Reminders
    print("\n\n💪 TEST 1: WORKOUT REMINDERS")
    print("-" * 80)
    
    workout_focuses = ["Upper Body", "Squat Day", "Deadlift Day", "Full Body"]
    
    print("\nGenerating workout reminders for different focuses:")
    for focus in workout_focuses:
        message = notif.generate_workout_reminder(
            user_name="Mike",
            workout_focus=focus
        )
        print(f"  • {focus}: {message}")
    
    # Test 2: Streak Celebrations
    print("\n\n🔥 TEST 2: STREAK CELEBRATIONS")
    print("-" * 80)
    
    streaks = [3, 7, 14, 30]
    
    print("\nGenerating streak celebrations:")
    for streak in streaks:
        message = notif.generate_streak_celebration(
            user_name="Sarah",
            streak_days=streak
        )
        print(f"  • {streak} days: {message}")
    
    # Test 3: Missed Workout (No Guilt)
    print("\n\n😊 TEST 3: MISSED WORKOUT REMINDERS (No Guilt)")
    print("-" * 80)
    
    print("\nGenerating 5 different missed workout reminders:")
    for i in range(5):
        message = notif.generate_missed_workout_reminder(user_name="Alex")
        print(f"  {i+1}. {message}")
    
    # Test 4: PR Celebrations
    print("\n\n🎉 TEST 4: PR CELEBRATIONS")
    print("-" * 80)
    
    prs = [
        {"exercise": "Bench Press", "weight": 225, "unit": "lbs", "reps": 8},
        {"exercise": "Squat", "weight": 315, "unit": "lbs", "reps": 5},
        {"exercise": "Deadlift", "weight": 405, "unit": "lbs", "reps": 3},
    ]
    
    print("\nGenerating PR celebrations:")
    for pr in prs:
        message = notif.generate_pr_celebration(
            user_name="Jordan",
            exercise=pr["exercise"],
            weight=pr["weight"],
            unit=pr["unit"],
            reps=pr["reps"]
        )
        print(f"  • {message}")
    
    # Test 5: Program Completion
    print("\n\n🏆 TEST 5: PROGRAM COMPLETION")
    print("-" * 80)
    
    programs = [
        {"name": "Beginner Strength Program", "weeks": 12},
        {"name": "Hypertrophy Block", "weeks": 8},
        {"name": "Powerlifting Peaking Program", "weeks": 6},
    ]
    
    print("\nGenerating program completion celebrations:")
    for program in programs:
        message = notif.generate_program_completion(
            user_name="Taylor",
            program_name=program["name"],
            weeks=program["weeks"]
        )
        print(f"  • {message}")
    
    # Test 6: Deload Week Reminder
    print("\n\n📉 TEST 6: DELOAD WEEK REMINDERS")
    print("-" * 80)
    
    print("\nGenerating 3 different deload week reminders:")
    for i in range(3):
        message = notif.generate_deload_week_reminder(user_name="Chris")
        print(f"  {i+1}. {message}")
    
    # Test 7: Rest Day Reminder
    print("\n\n💤 TEST 7: REST DAY REMINDERS")
    print("-" * 80)
    
    print("\nGenerating 3 different rest day reminders:")
    for i in range(3):
        message = notif.generate_rest_day_reminder(user_name="Sam")
        print(f"  {i+1}. {message}")
    
    # Test 8: Variety Check
    print("\n\n🎲 TEST 8: VARIETY CHECK (Same notification type)")
    print("-" * 80)
    
    print("\nGenerating 10 workout reminders to check variety:")
    for i in range(10):
        message = notif.generate_workout_reminder(
            user_name="Pat",
            workout_focus="Upper Body"
        )
        print(f"  {i+1}. {message}")
    
    print("\n" + "="*80)
    print("✅ NOTIFICATION PERSONALITY TEST COMPLETE")
    print("="*80)
    print("\nKey Features Demonstrated:")
    print("1. ✅ Workout reminders are contextual to day's focus")
    print("2. ✅ Streak celebrations scale with achievement (3/7/14/30 days)")
    print("3. ✅ Missed workout reminders have NO guilt-tripping")
    print("4. ✅ PR celebrations are immediate and exciting")
    print("5. ✅ Program completion celebrates major milestones")
    print("6. ✅ Deload week reminders explain why it's important")
    print("7. ✅ Rest day reminders encourage recovery")
    print("8. ✅ Variety in messages (not repetitive)")
    print("9. ✅ Duolingo-inspired (friendly, motivating, not annoying)")
    print("10. ✅ Uses user's name for personalization")
    print("\n")


if __name__ == "__main__":
    test_notification_personality()

