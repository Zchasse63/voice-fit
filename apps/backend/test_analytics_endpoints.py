"""
Test Analytics Endpoints

Tests GET /api/analytics/volume, /fatigue, /deload endpoints.
"""

import sys
import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = "http://localhost:8000"

def test_volume_analytics_endpoint():
    """Test GET /api/analytics/volume/{user_id}"""
    print("\n" + "="*80)
    print("TEST 1: Volume Analytics Endpoint")
    print("="*80)
    
    try:
        print(f"\n📤 Request:")
        print(f"   URL: {BASE_URL}/api/analytics/volume/{TEST_USER_ID}")

        response = requests.get(
            f"{BASE_URL}/api/analytics/volume/{TEST_USER_ID}",
            headers=get_test_auth_headers()
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        
        print(f"\n✅ Volume Analytics:")
        if 'weekly_volume' in data:
            print(f"   Weekly Total Sets: {data['weekly_volume'].get('total_sets', 'N/A')}")
        if 'volume_trend' in data:
            print(f"   Trend: {data['volume_trend'].get('trend', 'N/A')}")
        
        # Validate structure
        assert 'weekly_volume' in data
        assert 'monthly_volume' in data
        assert 'volume_trend' in data
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fatigue_analytics_endpoint():
    """Test GET /api/analytics/fatigue/{user_id}"""
    print("\n" + "="*80)
    print("TEST 2: Fatigue Analytics Endpoint")
    print("="*80)
    
    try:
        print(f"\n📤 Request:")
        print(f"   URL: {BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}")

        response = requests.get(
            f"{BASE_URL}/api/analytics/fatigue/{TEST_USER_ID}",
            headers=get_test_auth_headers()
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        
        print(f"\n✅ Fatigue Analytics:")
        if 'current_fatigue' in data:
            print(f"   Fatigue Score: {data['current_fatigue'].get('fatigue_score', 'N/A')}/100")
            print(f"   Fatigue Level: {data['current_fatigue'].get('fatigue_level', 'N/A')}")
        
        # Validate structure
        assert 'current_fatigue' in data
        assert 'fatigue_history' in data
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_deload_analytics_endpoint():
    """Test GET /api/analytics/deload/{user_id}"""
    print("\n" + "="*80)
    print("TEST 3: Deload Analytics Endpoint")
    print("="*80)
    
    try:
        print(f"\n📤 Request:")
        print(f"   URL: {BASE_URL}/api/analytics/deload/{TEST_USER_ID}")

        response = requests.get(
            f"{BASE_URL}/api/analytics/deload/{TEST_USER_ID}",
            headers=get_test_auth_headers()
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        assert response.status_code == 200
        
        data = response.json()
        
        print(f"\n✅ Deload Recommendation:")
        print(f"   Deload Needed: {data.get('deload_needed', 'N/A')}")
        print(f"   Deload Type: {data.get('deload_type', 'N/A')}")
        print(f"   Confidence: {data.get('confidence', 'N/A')}")
        print(f"   Requires Approval: {data.get('requires_approval', 'N/A')}")
        
        # Validate structure
        assert 'deload_needed' in data
        assert 'deload_type' in data
        assert 'confidence' in data
        assert 'requires_approval' in data
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all analytics endpoint tests"""
    print("\n" + "="*80)
    print("ANALYTICS ENDPOINTS TEST SUITE")
    print("="*80)
    
    tests = [
        ("Volume Analytics Endpoint", test_volume_analytics_endpoint),
        ("Fatigue Analytics Endpoint", test_fatigue_analytics_endpoint),
        ("Deload Analytics Endpoint", test_deload_analytics_endpoint),
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

