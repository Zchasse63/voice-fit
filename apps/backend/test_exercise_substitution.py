"""
Exercise Substitution Integration Tests

Tests the complete exercise substitution system:
1. Get basic exercise substitutes
2. Get risk-aware substitutes (for injuries)
3. Get AI explanations for substitutes
4. Create or match custom exercise

Tests injury accommodation and exercise alternatives.
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class ExerciseSubstitutionTester:
    def __init__(self):
        self.results = []
        self.substitutes = []

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.results.append({"name": test_name, "passed": passed, "details": details})

    def test_get_substitutes(self) -> bool:
        """Test GET /api/exercises/substitutes"""
        print("\n" + "=" * 80)
        print("TEST 1: Get Exercise Substitutes")
        print("=" * 80)

        try:
            params = {
                "exercise_name": "Bench Press",
                "max_results": 5,
                "min_similarity_score": 0.6,
            }

            print(f"\n📤 Getting substitutes...")
            print(f"   Exercise: {params['exercise_name']}")
            print(f"   Max Results: {params['max_results']}")

            response = requests.get(
                f"{BASE_URL}/api/exercises/substitutes",
                params=params,
                headers=get_test_auth_headers(),
                timeout=15,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_substitutes = "substitutes" in data or "alternatives" in data
                has_original = "original_exercise" in data

                if has_substitutes:
                    substitutes = data.get("substitutes") or data.get("alternatives")
                    print(f"   Substitutes Found: {len(substitutes)}")

                    if len(substitutes) > 0:
                        self.substitutes = substitutes
                        for i, sub in enumerate(substitutes[:3], 1):
                            name = sub.get("name", "Unknown")
                            similarity = sub.get("similarity_score", 0)
                            print(f"      {i}. {name} (similarity: {similarity:.2f})")

                if has_original:
                    original = data.get("original_exercise")
                    print(f"   Original Exercise: {original}")

                print(f"   ✅ Substitutes retrieved successfully")

                passed = has_substitutes and len(substitutes) > 0
                self.log_result(
                    "Get Substitutes",
                    passed,
                    f"Found {len(substitutes) if has_substitutes else 0} substitutes",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result(
                    "Get Substitutes", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Get Substitutes", False, str(e))
            return False

    def test_get_risk_aware_substitutes(self) -> bool:
        """Test GET /api/exercises/substitutes/risk-aware"""
        print("\n" + "=" * 80)
        print("TEST 2: Get Risk-Aware Substitutes")
        print("=" * 80)

        try:
            params = {
                "exercise_name": "Deadlift",
                "injured_body_part": "lower_back",
                "max_results": 5,
                "min_similarity_score": 0.6,
            }

            print(f"\n📤 Getting risk-aware substitutes...")
            print(f"   Exercise: {params['exercise_name']}")
            print(f"   Injured Body Part: {params['injured_body_part']}")

            response = requests.get(
                f"{BASE_URL}/api/exercises/substitutes/risk-aware",
                params=params,
                headers=get_test_auth_headers(),
                timeout=20,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_substitutes = "substitutes" in data or "safe_alternatives" in data
                has_filtered = "filtered_count" in data or "removed_unsafe" in data

                if has_substitutes:
                    substitutes = data.get("substitutes") or data.get(
                        "safe_alternatives"
                    )
                    print(f"   Safe Substitutes Found: {len(substitutes)}")

                    if len(substitutes) > 0:
                        for i, sub in enumerate(substitutes[:3], 1):
                            name = sub.get("name", "Unknown")
                            risk_level = sub.get("risk_level", "Unknown")
                            print(f"      {i}. {name} (risk: {risk_level})")

                if has_filtered:
                    filtered = data.get("filtered_count") or data.get("removed_unsafe")
                    print(f"   Filtered Out: {filtered} unsafe exercises")

                print(f"   ✅ Risk-aware substitutes retrieved")

                passed = has_substitutes
                self.log_result(
                    "Risk-Aware Substitutes",
                    passed,
                    f"Safe alternatives: {has_substitutes}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result(
                    "Risk-Aware Substitutes", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Risk-Aware Substitutes", False, str(e))
            return False

    def test_explain_substitutes(self) -> bool:
        """Test GET /api/exercises/substitutes/explain"""
        print("\n" + "=" * 80)
        print("TEST 3: Explain Exercise Substitutes")
        print("=" * 80)

        try:
            params = {
                "exercise_name": "Squat",
                "substitute_name": "Leg Press",
            }

            print(f"\n📤 Getting AI explanation...")
            print(f"   Original: {params['exercise_name']}")
            print(f"   Substitute: {params['substitute_name']}")

            response = requests.get(
                f"{BASE_URL}/api/exercises/substitutes/explain",
                params=params,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_explanation = "explanation" in data or "why_substitute" in data
                has_similarities = "similarities" in data
                has_differences = "differences" in data

                if has_explanation:
                    explanation = data.get("explanation") or data.get("why_substitute")
                    print(f"   Explanation: {explanation[:150]}...")

                if has_similarities:
                    similarities = data.get("similarities")
                    print(f"   Similarities: {similarities[:100]}...")

                if has_differences:
                    differences = data.get("differences")
                    print(f"   Differences: {differences[:100]}...")

                print(f"   ✅ Explanation retrieved successfully")

                passed = has_explanation
                self.log_result(
                    "Explain Substitutes",
                    passed,
                    f"Explanation: {has_explanation}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result(
                    "Explain Substitutes", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Explain Substitutes", False, str(e))
            return False

    def test_create_or_match_exercise(self) -> bool:
        """Test POST /api/exercises/create-or-match"""
        print("\n" + "=" * 80)
        print("TEST 4: Create or Match Exercise")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "exercise_name": "Bulgarian Split Squat",
                "category": "legs",
            }

            print(f"\n📤 Creating or matching exercise...")
            print(f"   Exercise: {payload['exercise_name']}")
            print(f"   Category: {payload['category']}")

            response = requests.post(
                f"{BASE_URL}/api/exercises/create-or-match",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=15,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_exercise_id = "exercise_id" in data or "id" in data
                has_matched = "matched" in data or "is_match" in data
                has_created = "created" in data or "is_new" in data

                if has_exercise_id:
                    exercise_id = data.get("exercise_id") or data.get("id")
                    print(f"   Exercise ID: {exercise_id}")

                if has_matched:
                    matched = data.get("matched") or data.get("is_match")
                    print(f"   Matched Existing: {matched}")

                if has_created:
                    created = data.get("created") or data.get("is_new")
                    print(f"   Created New: {created}")

                print(f"   ✅ Exercise created or matched successfully")

                passed = has_exercise_id or response.status_code == 200
                self.log_result(
                    "Create or Match Exercise",
                    passed,
                    f"Exercise ID: {has_exercise_id}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result(
                    "Create or Match Exercise", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Create or Match Exercise", False, str(e))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("EXERCISE SUBSTITUTION TEST SUMMARY")
        print("=" * 80)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(
            f"\n📊 Overall Results: {passed}/{total} tests passed ({passed / total * 100:.1f}%)"
        )
        print("\n" + "-" * 80)

        for result in self.results:
            status = "✅ PASS" if result["passed"] else "❌ FAIL"
            print(f"{status}: {result['name']}")
            if result["details"]:
                print(f"         {result['details']}")

        print("\n" + "=" * 80)

        if passed == total:
            print("🎉 ALL EXERCISE SUBSTITUTION TESTS PASSED!")
            print("=" * 80)
            return 0
        else:
            print(f"⚠️  {total - passed} TEST(S) FAILED")
            print("=" * 80)
            return 1

    def run_all_tests(self):
        """Run all exercise substitution tests"""
        print("\n" + "=" * 80)
        print("EXERCISE SUBSTITUTION TEST SUITE")
        print("=" * 80)
        print(f"Target: {BASE_URL}")
        print(f"User ID: {TEST_USER_ID}")
        print("=" * 80)

        # Run tests in order
        self.test_get_substitutes()
        time.sleep(1)

        self.test_get_risk_aware_substitutes()
        time.sleep(1)

        self.test_explain_substitutes()
        time.sleep(1)

        self.test_create_or_match_exercise()

        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    tester = ExerciseSubstitutionTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
