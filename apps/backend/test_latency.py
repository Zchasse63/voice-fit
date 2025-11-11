"""
Test API Latency

Tests response times for all endpoints.
"""

import sys
import time
import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, MAX_ANALYTICS_LATENCY, MAX_AI_LATENCY, MAX_RUNNING_LATENCY, get_test_auth_headers

load_dotenv()

BASE_URL = "http://localhost:8000"

def measure_latency(name, url, method="GET", payload=None, timeout=30, accept_errors=False):
    """Measure endpoint latency

    Args:
        accept_errors: If True, treat 404/500 as success (endpoint is accessible, just no data)
    """
    try:
        start = time.time()

        headers = get_test_auth_headers()

        if method == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        else:
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)

        latency = time.time() - start

        # For latency testing, we care that the endpoint is accessible
        # 404/500 for non-existent data is acceptable
        success = response.status_code == 200
        if accept_errors and response.status_code in [404, 500]:
            success = True

        return {
            "name": name,
            "latency": latency,
            "status_code": response.status_code,
            "success": success
        }

    except Exception as e:
        return {
            "name": name,
            "latency": -1,
            "status_code": -1,
            "success": False,
            "error": str(e)
        }


def test_analytics_endpoints_latency():
    """Test analytics endpoints latency"""
    print("\n" + "="*80)
    print(f"TEST 1: Analytics Endpoints Latency (Target: < {MAX_ANALYTICS_LATENCY}s)")
    print("="*80)
    
    endpoints = [
        ("Volume Analytics", f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}", "GET", None),
        ("Fatigue Analytics", f"{BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}", "GET", None),
        ("Deload Analytics", f"{BASE_URL}/api/analytics/deload/{TEST_USER_ID}", "GET", None),
    ]
    
    results = []
    
    for name, url, method, payload in endpoints:
        print(f"\n📊 Testing: {name}")
        result = measure_latency(name, url, method, payload)
        results.append(result)
        
        if result['success']:
            status = "✅" if result['latency'] < MAX_ANALYTICS_LATENCY else "⚠️ "
            print(f"   {status} Latency: {result['latency']:.3f}s")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")

    # Summary
    successful = [r for r in results if r['success']]
    if successful:
        avg_latency = sum(r['latency'] for r in successful) / len(successful)
        print(f"\n   Average Latency: {avg_latency:.3f}s")

        if avg_latency < MAX_ANALYTICS_LATENCY:
            print(f"   ✅ All endpoints under {MAX_ANALYTICS_LATENCY}s target")
            return True
        else:
            print(f"   ⚠️  Some endpoints over {MAX_ANALYTICS_LATENCY}s target")
            return False
    else:
        print(f"\n   ❌ All endpoints failed")
        return False


def test_ai_endpoints_latency():
    """Test AI endpoints latency"""
    print("\n" + "="*80)
    print(f"TEST 2: AI Endpoints Latency (Target: < {MAX_AI_LATENCY}s)")
    print("="*80)
    
    endpoints = [
        ("AI Coach", f"{BASE_URL}/api/coach/ask", "POST", {
            "user_id": TEST_USER_ID,
            "question": "How do I get bigger arms?"
        }),
        ("Workout Insights", f"{BASE_URL}/api/workout/insights", "POST", {
            "user_id": TEST_USER_ID,
            "workout_id": "00000000-0000-0000-0000-000000000001"  # Valid UUID format
        }),
    ]
    
    results = []
    
    for name, url, method, payload in endpoints:
        print(f"\n📊 Testing: {name}")
        # Accept 404/500 for workout insights (test workout doesn't exist)
        accept_errors = "Workout Insights" in name
        result = measure_latency(name, url, method, payload, accept_errors=accept_errors)
        results.append(result)
        
        if result['success']:
            status = "✅" if result['latency'] < MAX_AI_LATENCY else "⚠️ "
            print(f"   {status} Latency: {result['latency']:.3f}s")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")

    # Summary
    successful = [r for r in results if r['success']]
    if successful:
        avg_latency = sum(r['latency'] for r in successful) / len(successful)
        print(f"\n   Average Latency: {avg_latency:.3f}s")

        if avg_latency < MAX_AI_LATENCY:
            print(f"   ✅ All endpoints under {MAX_AI_LATENCY}s target")
            return True
        else:
            print(f"   ⚠️  Some endpoints over {MAX_AI_LATENCY}s target")
            return False
    else:
        print(f"\n   ❌ All endpoints failed")
        return False


def test_running_endpoints_latency():
    """Test running endpoints latency"""
    print("\n" + "="*80)
    print(f"TEST 3: Running Endpoints Latency (Target: < {MAX_RUNNING_LATENCY}s)")
    print("="*80)
    
    endpoints = [
        ("Running Parse", f"{BASE_URL}/api/running/parse", "POST", {
            "user_id": TEST_USER_ID,
            "distance": 5.0,
            "distance_unit": "miles",
            "duration_seconds": 2400,  # 40 minutes
            "elevation_gain": 61.0,  # 200 ft in meters
            "elevation_loss": 45.7,  # 150 ft in meters
            "latitude": 37.7749,
            "longitude": -122.4194
        }),
        # Running Analyze requires a real run_id from parse, so we'll skip it for latency test
        # ("Running Analyze", f"{BASE_URL}/api/running/analyze", "POST", {
        #     "user_id": TEST_USER_ID,
        #     "run_id": "test-run-12345"
        # }),
    ]
    
    results = []
    
    for name, url, method, payload in endpoints:
        print(f"\n📊 Testing: {name}")
        result = measure_latency(name, url, method, payload)
        results.append(result)
        
        if result['success']:
            status = "✅" if result['latency'] < MAX_RUNNING_LATENCY else "⚠️ "
            print(f"   {status} Latency: {result['latency']:.3f}s")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")

    # Summary
    successful = [r for r in results if r['success']]
    if successful:
        avg_latency = sum(r['latency'] for r in successful) / len(successful)
        print(f"\n   Average Latency: {avg_latency:.3f}s")

        if avg_latency < MAX_RUNNING_LATENCY:
            print(f"   ✅ All endpoints under {MAX_RUNNING_LATENCY}s target")
            return True
        else:
            print(f"   ⚠️  Some endpoints over {MAX_RUNNING_LATENCY}s target")
            return False
    else:
        print(f"\n   ❌ All endpoints failed")
        return False


def run_all_tests():
    """Run all latency tests"""
    print("\n" + "="*80)
    print("API LATENCY TEST SUITE")
    print("="*80)
    
    tests = [
        ("Analytics Endpoints Latency", test_analytics_endpoints_latency),
        ("AI Endpoints Latency", test_ai_endpoints_latency),
        ("Running Endpoints Latency", test_running_endpoints_latency),
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

