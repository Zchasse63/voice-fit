"""
Test AI Coach Endpoint

Tests POST /api/coach/ask endpoint with user context and RAG.
"""

import os
import sys

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def test_ai_coach_basic_question():
    """Test AI Coach with basic question"""
    print("\n" + "=" * 80)
    print("TEST 1: AI Coach Basic Question")
    print("=" * 80)

    try:
        payload = {"user_id": TEST_USER_ID, "question": "How do I get bigger arms?"}

        print(f"\n📤 Request:")
        print(f"   URL: {BASE_URL}/api/coach/ask")
        print(f"   Question: {payload['question']}")

        response = requests.post(
            f"{BASE_URL}/api/coach/ask",
            json=payload,
            headers=get_test_auth_headers(),
            timeout=30,
        )

        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")

        assert response.status_code == 200

        data = response.json()

        print(f"\n✅ AI Coach Response:")
        if "answer" in data:
            answer = data["answer"]
            print(f"   {answer[:300] if len(answer) > 300 else answer}...")
        if "sources" in data:
            print(f"   Sources: {len(data['sources'])} knowledge base articles")
        if "confidence" in data:
            print(f"   Confidence: {data['confidence']:.2f}")

        # Validate response
        assert "answer" in data
        assert len(data["answer"]) > 0

        print("\n✅ All validations passed")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_ai_coach_with_context():
    """Test AI Coach with user context"""
    print("\n" + "=" * 80)
    print("TEST 2: AI Coach with User Context")
    print("=" * 80)

    try:
        payload = {
            "user_id": TEST_USER_ID,
            "question": "Based on my recent workouts, what should I focus on?",
        }

        print(f"\n📤 Request:")
        print(f"   Question: {payload['question']}")
        print(f"   (Should use full user context)")

        response = requests.post(
            f"{BASE_URL}/api/coach/ask",
            json=payload,
            headers=get_test_auth_headers(),
            timeout=30,
        )

        assert response.status_code == 200

        data = response.json()

        print(f"\n✅ Context-Aware Response:")
        if "answer" in data:
            answer = data["answer"]
            print(f"   {answer[:300] if len(answer) > 300 else answer}...")

        # Response should reference user's data
        assert "answer" in data

        print("\n✅ Test completed")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_ai_coach_rag_retrieval():
    """Test AI Coach RAG retrieval"""
    print("\n" + "=" * 80)
    print("TEST 3: AI Coach RAG Retrieval")
    print("=" * 80)

    try:
        payload = {"user_id": TEST_USER_ID, "question": "What is progressive overload?"}

        print(f"\n📤 Testing RAG retrieval...")
        print(f"   Question: {payload['question']}")

        response = requests.post(
            f"{BASE_URL}/api/coach/ask",
            json=payload,
            headers=get_test_auth_headers(),
            timeout=30,
        )

        assert response.status_code == 200

        data = response.json()

        print(f"\n✅ RAG Response:")
        if "sources" in data and len(data["sources"]) > 0:
            print(f"   Retrieved {len(data['sources'])} knowledge base articles")
            # Sources are strings (category names), not objects
            for i, source in enumerate(data["sources"][:3], 1):
                print(f"   {i}. {source}")
        else:
            print(f"   No sources retrieved (may not be using RAG)")

        print("\n✅ Test completed")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def run_all_tests():
    """Run all AI Coach tests"""
    print("\n" + "=" * 80)
    print("AI COACH ENDPOINT TEST SUITE")
    print("=" * 80)

    tests = [
        ("AI Coach Basic Question", test_ai_coach_basic_question),
        ("AI Coach with User Context", test_ai_coach_with_context),
        ("AI Coach RAG Retrieval", test_ai_coach_rag_retrieval),
    ]

    results = []
    for name, test_func in tests:
        result = test_func()
        results.append((name, result))

    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed ({passed / total * 100:.1f}%)")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
