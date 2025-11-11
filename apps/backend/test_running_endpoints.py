"""
Test Running Endpoints

Tests POST /api/running/parse and POST /api/running/analyze endpoints.
"""

import sys
import requests
from datetime import datetime
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = "http://localhost:8000"

def test_running_parse_endpoint():
    """Test POST /api/running/parse endpoint"""
    print("\n" + "="*80)
    print("TEST 1: POST /api/running/parse")
    print("="*80)
    
    try:
        # Test data - API expects distance in km/miles, duration in seconds, elevation in meters
        payload = {
            "user_id": TEST_USER_ID,
            "distance": 5.0,
            "distance_unit": "miles",
            "duration_seconds": 40 * 60,  # 40 minutes = 2400 seconds
            "elevation_gain": 200 * 0.3048,  # 200 ft to meters
            "elevation_loss": 150 * 0.3048,  # 150 ft to meters
            "latitude": 37.7749,
            "longitude": -122.4194
        }

        print(f"\n📤 Request:")
        print(f"   URL: {BASE_URL}/api/running/parse")
        print(f"   User ID: {TEST_USER_ID}")
        print(f"   Distance: {payload['distance']} {payload['distance_unit']}")
        print(f"   Duration: {payload['duration_seconds']} seconds ({payload['duration_seconds']//60} minutes)")
        print(f"   Elevation Gain: {payload['elevation_gain']:.1f} meters")
        print(f"   Location: ({payload['latitude']}, {payload['longitude']})")

        # Make authenticated request
        response = requests.post(
            f"{BASE_URL}/api/running/parse",
            json=payload,
            headers=get_test_auth_headers()
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()

        print(f"\n✅ Parsed Run Data:")
        print(f"   Run ID: {data.get('run_id', 'N/A')}")
        print(f"   Pace: {data.get('pace_formatted', 'N/A')}")
        if data.get('gap'):
            print(f"   GAP: {data.get('gap_formatted', 'N/A')}")

        if 'elevation_data' in data and data['elevation_data']:
            print(f"\n   Elevation:")
            print(f"   - Grade: {data['elevation_data'].get('grade_percent', 'N/A'):.2f}%")
            print(f"   - Difficulty: {data['elevation_data'].get('difficulty', 'N/A')}")

        if 'weather_data' in data and data['weather_data']:
            print(f"\n   Weather:")
            print(f"   - Temperature: {data['weather_data'].get('temperature_f', 'N/A')}°F")
            print(f"   - Humidity: {data['weather_data'].get('humidity', 'N/A')}%")
            print(f"   - Conditions: {data['weather_data'].get('conditions', 'N/A')}")

        # Validate response structure
        assert 'success' in data
        assert 'run_id' in data
        assert 'pace' in data
        assert 'pace_formatted' in data
        assert 'message' in data

        print(f"\n   Message: {data.get('message', 'N/A')}")
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_running_analyze_endpoint():
    """Test POST /api/running/analyze endpoint"""
    print("\n" + "="*80)
    print("TEST 2: POST /api/running/analyze")
    print("="*80)

    try:
        # First, create a run to analyze
        print(f"\n📤 Step 1: Creating a run to analyze...")
        create_payload = {
            "user_id": TEST_USER_ID,
            "distance": 5.0,
            "distance_unit": "miles",
            "duration_seconds": 2400,  # 40 minutes
            "elevation_gain": 61.0,
            "elevation_loss": 45.7,
            "latitude": 37.7749,
            "longitude": -122.4194
        }

        create_response = requests.post(
            f"{BASE_URL}/api/running/parse",
            json=create_payload,
            headers=get_test_auth_headers()
        )

        if create_response.status_code != 200:
            print(f"❌ Failed to create run: {create_response.status_code}")
            print(f"   Response: {create_response.text}")
            return False

        run_data = create_response.json()
        run_id = run_data['run_id']
        print(f"✅ Run created with ID: {run_id}")

        # Now analyze the run
        print(f"\n📤 Step 2: Analyzing the run...")
        payload = {
            "user_id": TEST_USER_ID,
            "run_id": run_id
        }

        print(f"   URL: {BASE_URL}/api/running/analyze")
        print(f"   User ID: {TEST_USER_ID}")
        print(f"   Run ID: {run_id}")

        # Make authenticated request
        response = requests.post(
            f"{BASE_URL}/api/running/analyze",
            json=payload,
            headers=get_test_auth_headers()
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()

        print(f"\n✅ Analysis Results:")

        if 'run_summary' in data:
            print(f"\n   Run Summary:")
            print(f"   - Distance: {data['run_summary'].get('distance', 'N/A')} km")
            print(f"   - Pace: {data['run_summary'].get('pace', 'N/A')} min/km")
            if data['run_summary'].get('gap'):
                print(f"   - GAP: {data['run_summary'].get('gap', 'N/A')} min/km")

        if 'weather_impact' in data and data['weather_impact']:
            print(f"\n   Weather Impact:")
            print(f"   - Temperature Impact: {data['weather_impact'].get('temperature_impact', 'N/A')}")
            print(f"   - Overall Difficulty: {data['weather_impact'].get('overall_difficulty', 'N/A')}")

        if 'elevation_analysis' in data and data['elevation_analysis']:
            print(f"\n   Elevation Analysis:")
            print(f"   - Grade: {data['elevation_analysis'].get('grade_percent', 'N/A')}%")
            print(f"   - Difficulty: {data['elevation_analysis'].get('difficulty', 'N/A')}")

        if 'performance_insights' in data:
            print(f"\n   AI Insights:")
            insights = data['performance_insights']
            print(f"   {insights[:200] if len(insights) > 200 else insights}...")

        # Validate response structure
        assert 'run_summary' in data
        assert 'performance_insights' in data

        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_running_parse_with_weather():
    """Test running parse with weather integration"""
    print("\n" + "="*80)
    print("TEST 3: Running Parse with Weather Integration")
    print("="*80)
    
    try:
        payload = {
            "user_id": TEST_USER_ID,
            "distance": 3.0,
            "distance_unit": "miles",
            "duration_seconds": 24 * 60,  # 24 minutes
            "elevation_gain": 0,
            "elevation_loss": 0,
            "latitude": 40.7128,
            "longitude": -74.0060
        }

        print(f"\n📤 Testing weather integration...")
        print(f"   User ID: {TEST_USER_ID}")
        print(f"   Location: New York ({payload['latitude']}, {payload['longitude']})")

        # Make authenticated request
        response = requests.post(
            f"{BASE_URL}/api/running/parse",
            json=payload,
            headers=get_test_auth_headers()
        )
        
        assert response.status_code == 200
        
        data = response.json()

        # Check if weather data was fetched
        if 'weather_data' in data and data['weather_data']:
            print(f"\n✅ Weather Data Retrieved:")
            print(f"   Temperature: {data['weather_data']['temperature_f']}°F")
            print(f"   Humidity: {data['weather_data']['humidity']}%")
            print(f"   Wind Speed: {data['weather_data'].get('wind_speed_mph', 'N/A')} mph")
            print(f"   Conditions: {data['weather_data']['conditions']}")

            assert 'temperature_f' in data['weather_data']
            assert 'humidity' in data['weather_data']

        else:
            print(f"\n⚠️  Weather data not included in response")

        print("\n✅ Test completed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all running endpoint tests"""
    print("\n" + "="*80)
    print("RUNNING ENDPOINTS TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    tests = [
        ("POST /api/running/parse", test_running_parse_endpoint),
        ("POST /api/running/analyze", test_running_analyze_endpoint),
        ("Running Parse with Weather", test_running_parse_with_weather),
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

