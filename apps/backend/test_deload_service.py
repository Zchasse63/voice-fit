"""
Test Deload Recommendation Service

Tests programmed and auto-regulation deload detection.
"""

import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from test_config import TEST_USER_ID

load_dotenv()

from deload_recommendation_service import DeloadRecommendationService
from fatigue_monitoring_service import FatigueMonitoringService
from volume_tracking_service import VolumeTrackingService

def test_programmed_deload_detection():
    """Test programmed deload detection"""
    print("\n" + "="*80)
    print("TEST 1: Programmed Deload Detection")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        # Initialize services
        fatigue_service = FatigueMonitoringService(supabase)
        volume_service = VolumeTrackingService(supabase)
        service = DeloadRecommendationService(supabase, fatigue_service, volume_service)

        user_id = TEST_USER_ID
        
        print(f"\n📊 Checking deload for user: {user_id}")
        
        result = service.check_deload_needed(user_id)
        
        print(f"\n✅ Deload Check Results:")
        print(f"   Deload Needed: {result['deload_needed']}")
        print(f"   Deload Type: {result['deload_type']}")
        print(f"   Reason: {result['reason']}")
        print(f"   Confidence: {result['confidence']}")
        print(f"   Requires Approval: {result['requires_approval']}")
        
        # Validate structure
        assert 'deload_needed' in result
        assert 'deload_type' in result
        assert 'reason' in result
        assert 'confidence' in result
        assert 'requires_approval' in result
        
        if result['deload_type']:
            assert result['deload_type'] in ['programmed', 'auto_regulation']
        
        if result['confidence'] != 'n/a':
            assert result['confidence'] in ['high', 'medium', 'low']
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_auto_regulation_deload():
    """Test auto-regulation deload detection"""
    print("\n" + "="*80)
    print("TEST 2: Auto-Regulation Deload Detection")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        # Initialize services
        fatigue_service = FatigueMonitoringService(supabase)
        volume_service = VolumeTrackingService(supabase)
        service = DeloadRecommendationService(supabase, fatigue_service, volume_service)

        user_id = TEST_USER_ID
        
        result = service.check_deload_needed(user_id)
        
        print(f"\n✅ Auto-Regulation Check:")
        
        if result['deload_type'] == 'auto_regulation':
            print(f"   ✅ Auto-regulation deload detected")
            print(f"   Reason: {result['reason']}")
            print(f"   Confidence: {result['confidence']}")
            print(f"   Requires Approval: {result['requires_approval']}")
            
            # Auto-regulation deloads should require approval
            assert result['requires_approval'] == True
            
        else:
            print(f"   ℹ️  No auto-regulation deload needed")
            print(f"   Current status: {result['deload_type'] or 'No deload'}")
        
        print("\n✅ Test completed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_confidence_scoring():
    """Test confidence scoring"""
    print("\n" + "="*80)
    print("TEST 3: Confidence Scoring")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        # Initialize services
        fatigue_service = FatigueMonitoringService(supabase)
        volume_service = VolumeTrackingService(supabase)
        service = DeloadRecommendationService(supabase, fatigue_service, volume_service)

        user_id = TEST_USER_ID
        
        result = service.check_deload_needed(user_id)
        
        print(f"\n✅ Confidence Scoring:")
        print(f"   Deload Needed: {result['deload_needed']}")
        print(f"   Confidence: {result['confidence']}")
        
        if result['deload_needed']:
            print(f"\n   Indicators:")
            for key, value in result['indicators'].items():
                print(f"   - {key}: {value}")
            
            # Validate confidence is appropriate
            assert result['confidence'] in ['high', 'medium', 'low']
            
        else:
            assert result['confidence'] == 'n/a'
        
        print("\n✅ Confidence validated")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_approval_requirements():
    """Test approval requirements"""
    print("\n" + "="*80)
    print("TEST 4: Approval Requirements")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        # Initialize services
        fatigue_service = FatigueMonitoringService(supabase)
        volume_service = VolumeTrackingService(supabase)
        service = DeloadRecommendationService(supabase, fatigue_service, volume_service)

        user_id = TEST_USER_ID
        
        result = service.check_deload_needed(user_id)
        
        print(f"\n✅ Approval Requirements:")
        print(f"   Deload Type: {result['deload_type']}")
        print(f"   Requires Approval: {result['requires_approval']}")
        
        # Validate approval logic
        if result['deload_type'] == 'programmed':
            # Programmed deloads are automatic
            assert result['requires_approval'] == False
            print(f"   ✅ Programmed deload (automatic)")
            
        elif result['deload_type'] == 'auto_regulation':
            # Auto-regulation deloads require approval
            assert result['requires_approval'] == True
            print(f"   ✅ Auto-regulation deload (requires approval)")
            
        else:
            # No deload needed
            assert result['requires_approval'] == False
            print(f"   ✅ No deload needed")
        
        print("\n✅ Approval logic validated")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_no_deload_needed():
    """Test when no deload is needed"""
    print("\n" + "="*80)
    print("TEST 5: No Deload Needed")
    print("="*80)
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        # Initialize services
        fatigue_service = FatigueMonitoringService(supabase)
        volume_service = VolumeTrackingService(supabase)
        service = DeloadRecommendationService(supabase, fatigue_service, volume_service)

        # Use a non-existent user (should have no data, no deload needed) - valid UUID format
        user_id = "00000000-0000-0000-0000-000000000000"
        
        print(f"\n📊 Testing with non-existent user: {user_id}")
        
        result = service.check_deload_needed(user_id)
        
        print(f"\n✅ No Deload Results:")
        print(f"   Deload Needed: {result['deload_needed']}")
        print(f"   Deload Type: {result['deload_type']}")
        print(f"   Reason: {result['reason']}")
        
        # Should return no deload needed
        assert result['deload_needed'] == False
        assert result['deload_type'] is None
        assert result['confidence'] == 'n/a'
        assert result['requires_approval'] == False
        
        print("\n✅ Correctly returned no deload needed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all deload service tests"""
    print("\n" + "="*80)
    print("DELOAD RECOMMENDATION SERVICE TEST SUITE")
    print("="*80)
    
    tests = [
        ("Programmed Deload Detection", test_programmed_deload_detection),
        ("Auto-Regulation Deload Detection", test_auto_regulation_deload),
        ("Confidence Scoring", test_confidence_scoring),
        ("Approval Requirements", test_approval_requirements),
        ("No Deload Needed", test_no_deload_needed),
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

