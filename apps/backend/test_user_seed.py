"""
Test User Seed Data

Verifies test user data exists in database.
"""

import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from test_config import TEST_USER_ID

load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def test_user_profile_exists():
    """Test that user profile exists"""
    print("\n" + "="*80)
    print("TEST 1: User Profile Exists")
    print("="*80)
    
    try:
        print(f"\n📊 Checking user profile for: {TEST_USER_ID}")
        
        # Query user_profiles table (users table is auth.users, managed by Supabase Auth)
        response = supabase.table("user_profiles").select("*").eq("user_id", TEST_USER_ID).execute()
        
        assert len(response.data) > 0, "User not found"
        
        user = response.data[0]

        print(f"\n✅ User Profile Found:")
        print(f"   User ID: {user['user_id']}")
        print(f"   Profile ID: {user['id']}")
        print(f"   Tier: {user.get('tier', 'N/A')}")
        print(f"   Experience: {user.get('experience_level', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_workout_data_exists():
    """Test that workout data exists"""
    print("\n" + "="*80)
    print("TEST 2: Workout Data Exists")
    print("="*80)
    
    try:
        print(f"\n📊 Checking workouts for: {TEST_USER_ID}")
        
        response = supabase.table("workouts").select("*").eq("user_id", TEST_USER_ID).execute()
        
        workout_count = len(response.data)
        
        print(f"\n✅ Workouts Found: {workout_count}")
        
        if workout_count > 0:
            print(f"   Latest workout: {response.data[0].get('name', 'N/A')}")
            print(f"   Date: {response.data[0].get('start_time', 'N/A')}")
        
        assert workout_count > 0, "No workouts found"
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_readiness_scores_exist():
    """Test that readiness scores exist"""
    print("\n" + "="*80)
    print("TEST 3: Readiness Scores Exist")
    print("="*80)
    
    try:
        print(f"\n📊 Checking readiness scores for: {TEST_USER_ID}")
        
        response = supabase.table("readiness_scores").select("*").eq("user_id", TEST_USER_ID).execute()
        
        score_count = len(response.data)
        
        print(f"\n✅ Readiness Scores Found: {score_count}")
        
        if score_count > 0:
            latest = response.data[0]
            print(f"   Latest score: {latest.get('score', 'N/A')}/100")
            print(f"   Date: {latest.get('date', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_runs_data_exists():
    """Test that runs data exists"""
    print("\n" + "="*80)
    print("TEST 4: Runs Data Exists")
    print("="*80)
    
    try:
        print(f"\n📊 Checking runs for: {TEST_USER_ID}")
        
        response = supabase.table("runs").select("*").eq("user_id", TEST_USER_ID).execute()
        
        run_count = len(response.data)
        
        print(f"\n✅ Runs Found: {run_count}")
        
        if run_count > 0:
            latest = response.data[0]
            print(f"   Latest run: {latest.get('distance_miles', 'N/A')} miles")
            print(f"   Pace: {latest.get('pace_min_per_mile', 'N/A')} min/mile")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_pr_history_exists():
    """Test that PR history exists"""
    print("\n" + "="*80)
    print("TEST 5: PR History Exists")
    print("="*80)
    
    try:
        print(f"\n📊 Checking PRs for: {TEST_USER_ID}")
        
        response = supabase.table("pr_history").select("*").eq("user_id", TEST_USER_ID).execute()
        
        pr_count = len(response.data)
        
        print(f"\n✅ PRs Found: {pr_count}")
        
        if pr_count > 0:
            latest = response.data[0]
            print(f"   Latest PR: {latest.get('exercise_name', 'N/A')}")
            print(f"   1RM: {latest.get('one_rm', 'N/A')} lbs")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_badges_exist():
    """Test that badges exist"""
    print("\n" + "="*80)
    print("TEST 6: Badges Exist")
    print("="*80)
    
    try:
        print(f"\n📊 Checking badges for: {TEST_USER_ID}")
        
        response = supabase.table("user_badges").select("*").eq("user_id", TEST_USER_ID).execute()
        
        badge_count = len(response.data)
        
        print(f"\n✅ Badges Found: {badge_count}")
        
        if badge_count > 0:
            for badge in response.data[:3]:
                print(f"   - {badge.get('badge_name', 'N/A')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_streaks_exist():
    """Test that streaks exist"""
    print("\n" + "="*80)
    print("TEST 7: Streaks Exist")
    print("="*80)
    
    try:
        print(f"\n📊 Checking streaks for: {TEST_USER_ID}")
        
        response = supabase.table("user_streaks").select("*").eq("user_id", TEST_USER_ID).execute()
        
        streak_count = len(response.data)
        
        print(f"\n✅ Streaks Found: {streak_count}")
        
        if streak_count > 0:
            for streak in response.data:
                print(f"   - {streak.get('streak_type', 'N/A')}: {streak.get('current_count', 0)} days")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all user seed data tests"""
    print("\n" + "="*80)
    print("USER SEED DATA TEST SUITE")
    print("="*80)
    print(f"Test User ID: {TEST_USER_ID}")
    print("="*80)
    
    tests = [
        ("User Profile Exists", test_user_profile_exists),
        ("Workout Data Exists", test_workout_data_exists),
        ("Readiness Scores Exist", test_readiness_scores_exist),
        ("Runs Data Exists", test_runs_data_exists),
        ("PR History Exists", test_pr_history_exists),
        ("Badges Exist", test_badges_exist),
        ("Streaks Exist", test_streaks_exist),
    ]
    
    results = []
    for name, test_func in tests:
        result = test_func()
        results.append((name, result))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())

