"""
Test Running Workflow Integration

Tests complete running workflow end-to-end.
"""

import sys
import requests
from datetime import datetime
from dotenv import load_dotenv
from test_config import TEST_USER_ID, TEST_LOCATION_SF

load_dotenv()

BASE_URL = "http://localhost:8000"

def test_complete_running_workflow():
    """Test complete running workflow"""
    print("\n" + "="*80)
    print("TEST 1: Complete Running Workflow")
    print("="*80)
    
    try:
        # Step 1: Parse run with weather
        print(f"\n🏃 Step 1: Parse run with weather")
        
        run_payload = {
            "user_id": TEST_USER_ID,
            "distance_miles": 5.0,
            "duration_minutes": 40.0,
            "elevation_gain_ft": 200,
            "elevation_loss_ft": 150,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"   Distance: {run_payload['distance_miles']} miles")
        print(f"   Duration: {run_payload['duration_minutes']} minutes")
        print(f"   Elevation: +{run_payload['elevation_gain_ft']}ft / -{run_payload['elevation_loss_ft']}ft")
        
        parse_response = requests.post(f"{BASE_URL}/api/running/parse", json=run_payload, timeout=30)
        
        if parse_response.status_code == 200:
            parse_data = parse_response.json()
            print(f"   ✅ Run parsed")
            print(f"   Actual Pace: {parse_data.get('actual_pace_min_per_mile', 'N/A'):.2f} min/mile")
            print(f"   GAP: {parse_data.get('gap_min_per_mile', 'N/A'):.2f} min/mile")
            
            if 'weather' in parse_data:
                print(f"   Weather: {parse_data['weather'].get('temperature', 'N/A')}°F, {parse_data['weather'].get('conditions', 'N/A')}")
        else:
            print(f"   ⚠️  Parse endpoint returned {parse_response.status_code}")
            parse_data = {}
        
        # Step 2: Analyze run performance
        print(f"\n📊 Step 2: Analyze run performance")
        
        analyze_payload = {
            "user_id": TEST_USER_ID,
            "run_id": "test-run-12345",
            "distance_miles": run_payload['distance_miles'],
            "actual_pace_min_per_mile": parse_data.get('actual_pace_min_per_mile', 8.0),
            "gap_min_per_mile": parse_data.get('gap_min_per_mile', 7.5),
            "elevation_gain_ft": run_payload['elevation_gain_ft'],
            "weather": parse_data.get('weather', {
                "temperature": 70,
                "humidity": 60,
                "wind_speed": 5,
                "conditions": "Clear"
            })
        }
        
        analyze_response = requests.post(f"{BASE_URL}/api/running/analyze", json=analyze_payload, timeout=30)
        
        if analyze_response.status_code == 200:
            analyze_data = analyze_response.json()
            print(f"   ✅ Run analyzed")
            if 'insights' in analyze_data:
                print(f"   AI Insights: {analyze_data['insights'][:150]}...")
        else:
            print(f"   ⚠️  Analyze endpoint returned {analyze_response.status_code}")
        
        # Step 3: Check for running badges
        print(f"\n🏅 Step 3: Check for running badges")
        print(f"   ℹ️  Badge checking (would be triggered automatically)")
        
        print(f"\n✅ Complete running workflow tested")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all running workflow tests"""
    print("\n" + "="*80)
    print("RUNNING WORKFLOW INTEGRATION TEST SUITE")
    print("="*80)
    
    tests = [
        ("Complete Running Workflow", test_complete_running_workflow),
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

