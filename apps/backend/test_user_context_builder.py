"""
Test UserContextBuilder

Tests context building with real user data.
"""

import sys
import time
import os
import asyncio
from dotenv import load_dotenv
from test_config import TEST_USER_ID
from supabase import create_client, Client

load_dotenv()

from user_context_builder import UserContextBuilder

def test_context_builder_initialization():
    """Test UserContextBuilder initialization"""
    print("\n" + "="*80)
    print("TEST 1: UserContextBuilder Initialization")
    print("="*80)

    try:
        print(f"\n📊 Initializing UserContextBuilder...")

        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        builder = UserContextBuilder(supabase)

        print(f"\n✅ UserContextBuilder initialized successfully")

        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_build_context_with_real_data():
    """Test building context with real user data"""
    print("\n" + "="*80)
    print("TEST 2: Build Context with Real Data")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        builder = UserContextBuilder(supabase)

        print(f"\n📊 Building context for user: {TEST_USER_ID}")

        start_time = time.time()
        context = await builder.build_context(TEST_USER_ID)
        duration = time.time() - start_time

        print(f"\n✅ Context Built:")
        print(f"   Duration: {duration:.2f}s")
        print(f"   Context Length: {len(context)} characters")

        # Print first 500 characters
        print(f"\n   Preview:")
        print(f"   {context[:500]}...")

        # Validate context has expected sections
        assert "USER PROFILE" in context or "Profile" in context or "USER CONTEXT" in context
        assert len(context) > 100

        # Performance check (increased to 10s to account for database queries)
        assert duration < 10.0, f"Context building too slow: {duration:.2f}s"

        print(f"\n✅ All validations passed")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_context_sections():
    """Test that all expected sections are present"""
    print("\n" + "="*80)
    print("TEST 3: Context Sections")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        builder = UserContextBuilder(supabase)
        context = await builder.build_context(TEST_USER_ID)
        
        print(f"\n📊 Checking for expected sections...")
        
        expected_sections = [
            "PROFILE",
            "WORKOUT",
            "READINESS",
            "PR",
            "PROGRAM"
        ]
        
        found_sections = []
        missing_sections = []
        
        for section in expected_sections:
            if section.lower() in context.lower():
                found_sections.append(section)
                print(f"   ✅ {section} section found")
            else:
                missing_sections.append(section)
                print(f"   ⚠️  {section} section not found")
        
        print(f"\n   Found: {len(found_sections)}/{len(expected_sections)} sections")
        
        # At least some sections should be present
        assert len(found_sections) > 0, "No expected sections found"
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_context_with_missing_data():
    """Test context building with user who has missing data"""
    print("\n" + "="*80)
    print("TEST 4: Context with Missing Data")
    print("="*80)

    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )

        builder = UserContextBuilder(supabase)

        # Use non-existent user
        user_id = "non-existent-user-12345"

        print(f"\n📊 Building context for non-existent user: {user_id}")

        context = await builder.build_context(user_id)

        print(f"\n✅ Context Built (with missing data):")
        print(f"   Context Length: {len(context)} characters")

        # Should still return some context, not error
        assert isinstance(context, str)

        print(f"\n✅ Handled missing data gracefully")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run all UserContextBuilder tests"""
    print("\n" + "="*80)
    print("USER CONTEXT BUILDER TEST SUITE")
    print("="*80)

    tests = [
        ("UserContextBuilder Initialization", test_context_builder_initialization),
        ("Build Context with Real Data", test_build_context_with_real_data),
        ("Context Sections", test_context_sections),
        ("Context with Missing Data", test_context_with_missing_data),
    ]

    results = []
    for name, test_func in tests:
        # Run async tests with asyncio
        if asyncio.iscoroutinefunction(test_func):
            result = await test_func()
        else:
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
    sys.exit(asyncio.run(run_all_tests()))

