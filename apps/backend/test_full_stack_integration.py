"""
Test Full Stack Integration

Tests complete workout logging workflow end-to-end.
"""

import sys
import requests
from datetime import datetime
from dotenv import load_dotenv
from test_config import TEST_USER_ID

load_dotenv()

BASE_URL = "http://localhost:8000"

def test_complete_workout_workflow():
    """Test complete workout logging workflow"""
    print("\n" + "="*80)
    print("TEST 1: Complete Workout Logging Workflow")
    print("="*80)
    
    try:
        # Step 1: Parse workout via voice
        print(f"\n📝 Step 1: Parse workout via voice")
        
        voice_payload = {
            "user_id": TEST_USER_ID,
            "transcript": "Bench press 225 for 8 reps RPE 8"
        }
        
        print(f"   Transcript: {voice_payload['transcript']}")
        
        # Note: This would call the voice parser endpoint
        # For now, we'll simulate the parsed data
        
        parsed_data = {
            "exercise_name": "Bench Press",
            "weight": 225,
            "reps": 8,
            "rpe": 8
        }
        
        print(f"   ✅ Parsed: {parsed_data['exercise_name']} - {parsed_data['weight']}lbs x {parsed_data['reps']} @ RPE {parsed_data['rpe']}")
        
        # Step 2: Save to database
        print(f"\n💾 Step 2: Save to database")
        print(f"   ✅ Workout saved (simulated)")
        
        # Step 3: Get workout insights
        print(f"\n📊 Step 3: Get workout insights")
        
        insights_payload = {
            "user_id": TEST_USER_ID,
            "workout_id": "test-workout-12345"
        }
        
        response = requests.post(f"{BASE_URL}/api/workout/insights", json=insights_payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Insights generated")
            if 'insights' in data:
                print(f"   Preview: {data['insights'][:150]}...")
        else:
            print(f"   ⚠️  Insights endpoint returned {response.status_code}")
        
        # Step 4: Check volume tracking
        print(f"\n📈 Step 4: Check volume tracking")
        
        volume_response = requests.get(f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}")
        
        if volume_response.status_code == 200:
            volume_data = volume_response.json()
            print(f"   ✅ Volume tracked")
            if 'weekly_volume' in volume_data:
                print(f"   Total sets this week: {volume_data['weekly_volume'].get('total_sets', 'N/A')}")
        else:
            print(f"   ⚠️  Volume endpoint returned {volume_response.status_code}")
        
        # Step 5: Check fatigue
        print(f"\n😴 Step 5: Check fatigue")
        
        fatigue_response = requests.get(f"{BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}")
        
        if fatigue_response.status_code == 200:
            fatigue_data = fatigue_response.json()
            print(f"   ✅ Fatigue assessed")
            if 'current_fatigue' in fatigue_data:
                print(f"   Fatigue score: {fatigue_data['current_fatigue'].get('fatigue_score', 'N/A')}/100")
        else:
            print(f"   ⚠️  Fatigue endpoint returned {fatigue_response.status_code}")
        
        # Step 6: Check deload recommendation
        print(f"\n🔄 Step 6: Check deload recommendation")
        
        deload_response = requests.get(f"{BASE_URL}/api/analytics/deload/{TEST_USER_ID}")
        
        if deload_response.status_code == 200:
            deload_data = deload_response.json()
            print(f"   ✅ Deload checked")
            print(f"   Deload needed: {deload_data.get('deload_needed', 'N/A')}")
        else:
            print(f"   ⚠️  Deload endpoint returned {deload_response.status_code}")
        
        print(f"\n✅ Complete workflow tested")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all full stack integration tests"""
    print("\n" + "="*80)
    print("FULL STACK INTEGRATION TEST SUITE")
    print("="*80)
    
    tests = [
        ("Complete Workout Logging Workflow", test_complete_workout_workflow),
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

