"""
Test API Load

Tests concurrent requests and load handling.
"""

import sys
import time
import requests
import concurrent.futures
from dotenv import load_dotenv
from test_config import TEST_USER_ID, CONCURRENT_USERS, MIN_SUCCESS_RATE

load_dotenv()

BASE_URL = "http://localhost:8000"

def make_request(endpoint_name, url, method="GET", payload=None):
    """Make a single request"""
    try:
        start = time.time()
        
        if method == "GET":
            response = requests.get(url, timeout=30)
        else:
            response = requests.post(url, json=payload, timeout=30)
        
        latency = time.time() - start
        
        return {
            "endpoint": endpoint_name,
            "success": response.status_code == 200,
            "latency": latency,
            "status_code": response.status_code
        }
        
    except Exception as e:
        return {
            "endpoint": endpoint_name,
            "success": False,
            "latency": -1,
            "error": str(e)
        }


def test_concurrent_analytics_requests():
    """Test concurrent analytics requests"""
    print("\n" + "="*80)
    print("TEST 1: Concurrent Analytics Requests (10 users)")
    print("="*80)
    
    try:
        print(f"\n📊 Simulating 10 concurrent users...")
        
        # Simulate 10 users requesting analytics
        requests_to_make = []
        for i in range(10):
            requests_to_make.append(("Volume Analytics", f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}", "GET", None))
        
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request, *req) for req in requests_to_make]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        total_time = time.time() - start_time
        
        # Analyze results
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        print(f"\n✅ Load Test Results:")
        print(f"   Total Time: {total_time:.2f}s")
        print(f"   Successful: {len(successful)}/10")
        print(f"   Failed: {len(failed)}/10")
        
        if successful:
            avg_latency = sum(r['latency'] for r in successful) / len(successful)
            max_latency = max(r['latency'] for r in successful)
            min_latency = min(r['latency'] for r in successful)
            
            print(f"\n   Latency Stats:")
            print(f"   - Average: {avg_latency:.3f}s")
            print(f"   - Min: {min_latency:.3f}s")
            print(f"   - Max: {max_latency:.3f}s")
        
        # Success if at least 80% succeeded
        success_rate = len(successful) / 10
        
        if success_rate >= 0.8:
            print(f"\n   ✅ Load test passed ({success_rate*100:.0f}% success rate)")
            return True
        else:
            print(f"\n   ❌ Load test failed ({success_rate*100:.0f}% success rate)")
            return False
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_mixed_endpoint_load():
    """Test mixed endpoint load"""
    print("\n" + "="*80)
    print("TEST 2: Mixed Endpoint Load (10 concurrent requests)")
    print("="*80)
    
    try:
        print(f"\n📊 Testing mixed endpoints concurrently...")
        
        # Mix of different endpoints
        requests_to_make = [
            ("Volume Analytics", f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}", "GET", None),
            ("Fatigue Analytics", f"{BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}", "GET", None),
            ("Deload Analytics", f"{BASE_URL}/api/analytics/deload/{TEST_USER_ID}", "GET", None),
            ("Volume Analytics", f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}", "GET", None),
            ("Fatigue Analytics", f"{BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}", "GET", None),
            ("Deload Analytics", f"{BASE_URL}/api/analytics/deload/{TEST_USER_ID}", "GET", None),
            ("Volume Analytics", f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}", "GET", None),
            ("Fatigue Analytics", f"{BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}", "GET", None),
            ("Deload Analytics", f"{BASE_URL}/api/analytics/deload/{TEST_USER_ID}", "GET", None),
            ("Volume Analytics", f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}", "GET", None),
        ]
        
        start_time = time.time()
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request, *req) for req in requests_to_make]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        total_time = time.time() - start_time
        
        # Analyze results
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        print(f"\n✅ Mixed Load Test Results:")
        print(f"   Total Time: {total_time:.2f}s")
        print(f"   Successful: {len(successful)}/10")
        print(f"   Failed: {len(failed)}/10")
        
        if successful:
            avg_latency = sum(r['latency'] for r in successful) / len(successful)
            print(f"   Average Latency: {avg_latency:.3f}s")
        
        # Success if at least 80% succeeded
        success_rate = len(successful) / 10
        
        if success_rate >= 0.8:
            print(f"\n   ✅ Load test passed ({success_rate*100:.0f}% success rate)")
            return True
        else:
            print(f"\n   ❌ Load test failed ({success_rate*100:.0f}% success rate)")
            return False
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all load tests"""
    print("\n" + "="*80)
    print("API LOAD TEST SUITE")
    print("="*80)
    
    tests = [
        ("Concurrent Analytics Requests", test_concurrent_analytics_requests),
        ("Mixed Endpoint Load", test_mixed_endpoint_load),
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

