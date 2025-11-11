"""
Test Fatigue Monitoring Service

Tests multi-indicator fatigue assessment and scoring.
"""

import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from test_config import TEST_USER_ID

load_dotenv()

from fatigue_monitoring_service import FatigueMonitoringService

def test_fatigue_assessment():
    """Test current fatigue assessment"""
    print("\n" + "="*80)
    print("TEST 1: Current Fatigue Assessment")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = FatigueMonitoringService(supabase)

        user_id = TEST_USER_ID
        
        print(f"\n📊 Assessing fatigue for user: {user_id}")
        
        result = service.assess_fatigue(user_id)
        
        print(f"\n✅ Fatigue Assessment Results:")
        print(f"   Fatigue Score: {result['fatigue_score']}/100")
        print(f"   Fatigue Level: {result['fatigue_level']}")
        print(f"   Recovery Recommendation: {result['recovery_recommendation']}")
        
        print(f"\n   Indicators:")
        for indicator, value in result['indicators'].items():
            print(f"   - {indicator}: {value}")
        
        # Validate structure
        assert 'fatigue_score' in result
        assert 'fatigue_level' in result
        assert 'recovery_recommendation' in result
        assert 'indicators' in result
        assert 0 <= result['fatigue_score'] <= 100
        assert result['fatigue_level'] in ['low', 'moderate', 'high', 'very_high']
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fatigue_score_calculation():
    """Test fatigue score calculation (0-100)"""
    print("\n" + "="*80)
    print("TEST 2: Fatigue Score Calculation")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = FatigueMonitoringService(supabase)

        user_id = TEST_USER_ID
        
        result = service.assess_fatigue(user_id)
        
        print(f"\n✅ Fatigue Score Breakdown:")
        print(f"   Total Score: {result['fatigue_score']}/100")
        
        indicators = result['indicators']
        print(f"\n   Component Scores:")
        print(f"   - Readiness Trend: {indicators.get('readiness_trend', 'N/A')}")
        print(f"   - RPE Trend: {indicators.get('rpe_trend', 'N/A')}")
        print(f"   - Volume Status: {indicators.get('volume_status', 'N/A')}")
        print(f"   - Sleep Quality: {indicators.get('sleep_quality', 'N/A')}")
        print(f"   - Soreness Level: {indicators.get('soreness_level', 'N/A')}")
        
        # Validate score is within range
        assert 0 <= result['fatigue_score'] <= 100

        # Validate fatigue level matches score (service uses: <25=low, <50=moderate, <75=high, >=75=very_high)
        score = result['fatigue_score']
        level = result['fatigue_level']

        if score < 25:
            assert level == 'low'
        elif score < 50:
            assert level == 'moderate'
        elif score < 75:
            assert level == 'high'
        else:
            assert level == 'very_high'
        
        print("\n✅ Score calculation validated")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fatigue_history():
    """Test fatigue history (4 weeks)"""
    print("\n" + "="*80)
    print("TEST 3: Fatigue History")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = FatigueMonitoringService(supabase)

        user_id = TEST_USER_ID
        
        print(f"\n📊 Fetching fatigue history for user: {user_id}")
        
        result = service.get_fatigue_history(user_id, weeks=4)
        
        print(f"\n✅ Fatigue History Results:")
        print(f"   Weeks of Data: {len(result['weeks'])}")
        
        print(f"\n   Weekly Breakdown:")
        for week in result['weeks']:
            print(f"   - Week {week['week_start']}: Score {week['fatigue_score']}/100 ({week['fatigue_level']})")
        
        # Validate structure
        assert 'weeks' in result
        assert len(result['weeks']) <= 4
        
        for week in result['weeks']:
            assert 'week_start' in week
            assert 'fatigue_score' in week
            assert 'fatigue_level' in week
            assert 0 <= week['fatigue_score'] <= 100
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_recovery_recommendations():
    """Test recovery recommendations"""
    print("\n" + "="*80)
    print("TEST 4: Recovery Recommendations")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = FatigueMonitoringService(supabase)

        user_id = TEST_USER_ID
        
        result = service.assess_fatigue(user_id)
        
        print(f"\n✅ Recovery Recommendation:")
        print(f"   Fatigue Level: {result['fatigue_level']}")
        print(f"   Recommendation: {result['recovery_recommendation']}")
        
        # Validate recommendation exists and is appropriate
        assert 'recovery_recommendation' in result
        assert isinstance(result['recovery_recommendation'], str)
        assert len(result['recovery_recommendation']) > 0
        
        # Check that recommendation matches fatigue level
        level = result['fatigue_level']
        rec = result['recovery_recommendation'].lower()
        
        if level == 'very_high':
            assert 'rest' in rec or 'deload' in rec or 'recovery' in rec
        elif level == 'low':
            assert 'continue' in rec or 'maintain' in rec or 'good' in rec
        
        print("\n✅ Recommendation validated")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_missing_data():
    """Test with missing readiness scores"""
    print("\n" + "="*80)
    print("TEST 5: Missing Data Handling")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = FatigueMonitoringService(supabase)
        
        # Use a non-existent user ID (valid UUID format)
        user_id = "00000000-0000-0000-0000-000000000000"
        
        print(f"\n📊 Testing with non-existent user: {user_id}")
        
        result = service.assess_fatigue(user_id)
        
        print(f"\n✅ Missing Data Results:")
        print(f"   Fatigue Score: {result['fatigue_score']}/100")
        print(f"   Fatigue Level: {result['fatigue_level']}")
        
        # Should return default/neutral values, not error
        assert 'fatigue_score' in result
        assert 'fatigue_level' in result
        assert 'recovery_recommendation' in result
        
        print("\n✅ Correctly handled missing data")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all fatigue monitoring tests"""
    print("\n" + "="*80)
    print("FATIGUE MONITORING SERVICE TEST SUITE")
    print("="*80)
    
    tests = [
        ("Current Fatigue Assessment", test_fatigue_assessment),
        ("Fatigue Score Calculation", test_fatigue_score_calculation),
        ("Fatigue History", test_fatigue_history),
        ("Recovery Recommendations", test_recovery_recommendations),
        ("Missing Data Handling", test_missing_data),
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

