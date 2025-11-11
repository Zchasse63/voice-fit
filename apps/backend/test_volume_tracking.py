"""
Test Volume Tracking Service

Tests weekly/monthly volume calculation by muscle group.
"""

import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from test_config import TEST_USER_ID

load_dotenv()

from volume_tracking_service import VolumeTrackingService

def test_weekly_volume_calculation():
    """Test weekly volume calculation by muscle group"""
    print("\n" + "="*80)
    print("TEST 1: Weekly Volume Calculation")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = VolumeTrackingService(supabase)

        # Test with real user
        user_id = TEST_USER_ID
        
        print(f"\n📊 Calculating weekly volume for user: {user_id}")
        
        result = service.get_weekly_volume(user_id)
        
        print(f"\n✅ Weekly Volume Results:")
        print(f"   Week Start: {result['week_start']}")
        print(f"   Week End: {result['week_end']}")
        print(f"   Total Sets: {result['total_sets']}")
        print(f"   Total Volume Load: {result['total_volume_load']:,.0f} lbs")
        
        print(f"\n   Volume by Muscle Group:")
        for muscle, data in sorted(result['volume_by_muscle'].items(), 
                                   key=lambda x: x[1]['sets'], reverse=True)[:5]:
            print(f"   - {muscle}: {data['sets']} sets, {data['volume_load']:,.0f} lbs")
        
        # Validate structure
        assert 'week_start' in result
        assert 'week_end' in result
        assert 'total_sets' in result
        assert 'total_volume_load' in result
        assert 'volume_by_muscle' in result
        assert isinstance(result['volume_by_muscle'], dict)
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_monthly_volume_calculation():
    """Test monthly volume calculation"""
    print("\n" + "="*80)
    print("TEST 2: Monthly Volume Calculation")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = VolumeTrackingService(supabase)

        user_id = TEST_USER_ID
        
        print(f"\n📊 Calculating monthly volume for user: {user_id}")
        
        result = service.get_monthly_volume(user_id)
        
        print(f"\n✅ Monthly Volume Results:")
        print(f"   Month Start: {result['month_start']}")
        print(f"   Month End: {result['month_end']}")
        print(f"   Total Sets: {result['total_sets']}")
        print(f"   Total Volume Load: {result['total_volume_load']:,.0f} lbs")
        print(f"   Average Weekly Sets: {result['avg_weekly_sets']:.1f}")
        
        print(f"\n   Top 5 Muscle Groups:")
        for muscle, data in sorted(result['volume_by_muscle'].items(), 
                                   key=lambda x: x[1]['sets'], reverse=True)[:5]:
            print(f"   - {muscle}: {data['sets']} sets, {data['volume_load']:,.0f} lbs")
        
        # Validate structure
        assert 'month_start' in result
        assert 'month_end' in result
        assert 'total_sets' in result
        assert 'avg_weekly_sets' in result
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_volume_trend_analysis():
    """Test volume trend analysis (4 weeks)"""
    print("\n" + "="*80)
    print("TEST 3: Volume Trend Analysis")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = VolumeTrackingService(supabase)

        user_id = TEST_USER_ID
        
        print(f"\n📊 Analyzing volume trend for user: {user_id}")
        
        result = service.get_volume_trend(user_id, weeks=4)
        
        print(f"\n✅ Volume Trend Results:")
        print(f"   Trend: {result['trend']}")
        print(f"   Average Weekly Sets: {result['avg_weekly_sets']:.1f}")
        
        print(f"\n   Weekly Breakdown:")
        for week in result['weeks']:
            print(f"   - Week {week['week_start']}: {week['total_sets']} sets")
        
        # Validate structure
        assert 'trend' in result
        assert result['trend'] in ['increasing', 'decreasing', 'stable']
        assert 'avg_weekly_sets' in result
        assert 'weeks' in result
        assert len(result['weeks']) <= 4
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_volume_load_calculation():
    """Test volume load calculation (sets × reps × weight)"""
    print("\n" + "="*80)
    print("TEST 4: Volume Load Calculation")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = VolumeTrackingService(supabase)

        user_id = TEST_USER_ID
        
        result = service.get_weekly_volume(user_id)
        
        print(f"\n✅ Volume Load Validation:")
        print(f"   Total Volume Load: {result['total_volume_load']:,.0f} lbs")
        
        # Check that volume load is calculated for each muscle group
        for muscle, data in result['volume_by_muscle'].items():
            assert 'volume_load' in data
            assert data['volume_load'] >= 0
            print(f"   - {muscle}: {data['volume_load']:,.0f} lbs")
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_empty_data():
    """Test with user who has no workout data"""
    print("\n" + "="*80)
    print("TEST 5: Empty Data Handling")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        service = VolumeTrackingService(supabase)
        
        # Use a non-existent user ID (valid UUID format)
        user_id = "00000000-0000-0000-0000-000000000000"
        
        print(f"\n📊 Testing with non-existent user: {user_id}")
        
        result = service.get_weekly_volume(user_id)
        
        print(f"\n✅ Empty Data Results:")
        print(f"   Total Sets: {result['total_sets']}")
        print(f"   Total Volume Load: {result['total_volume_load']}")
        print(f"   Muscle Groups: {len(result['volume_by_muscle'])}")
        
        # Should return zero values, not error
        assert result['total_sets'] == 0
        assert result['total_volume_load'] == 0
        assert len(result['volume_by_muscle']) == 0
        
        print("\n✅ Correctly handled empty data")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all volume tracking tests"""
    print("\n" + "="*80)
    print("VOLUME TRACKING SERVICE TEST SUITE")
    print("="*80)
    
    tests = [
        ("Weekly Volume Calculation", test_weekly_volume_calculation),
        ("Monthly Volume Calculation", test_monthly_volume_calculation),
        ("Volume Trend Analysis", test_volume_trend_analysis),
        ("Volume Load Calculation", test_volume_load_calculation),
        ("Empty Data Handling", test_empty_data),
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

