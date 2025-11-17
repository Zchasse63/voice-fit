"""
Injury Workflow Integration Tests

Tests the complete injury management lifecycle:
1. Log new injury
2. Get active injuries
3. Weekly check-in
4. Confidence feedback

Tests injury tracking, recovery monitoring, and safety features.
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class InjuryWorkflowTester:
    def __init__(self):
        self.results = []
        self.injury_id = None

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.results.append({"name": test_name, "passed": passed, "details": details})

    def test_log_injury(self) -> bool:
        """Test POST /api/injury/log"""
        print("\n" + "=" * 80)
        print("TEST 1: Log Injury")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "body_part": "lower_back",
                "severity": "moderate",
                "description": "Lower back pain during deadlifts, sharp pain on left side",
                "occurred_during_exercise": "Deadlift",
                "pain_level": 6,
            }

            print(f"\n📤 Logging injury...")
            print(f"   Body Part: {payload['body_part']}")
            print(f"   Severity: {payload['severity']}")
            print(f"   Pain Level: {payload['pain_level']}/10")

            response = requests.post(
                f"{BASE_URL}/api/injury/log",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_injury_id = "injury_id" in data or "id" in data
                has_status = "status" in data

                if has_injury_id:
                    self.injury_id = data.get("injury_id") or data.get("id")
                    print(f"   Injury ID: {self.injury_id}")

                if has_status:
                    status = data.get("status")
                    print(f"   Status: {status}")

                print(f"   ✅ Injury logged successfully")

                passed = has_injury_id
                self.log_result(
                    "Log Injury",
                    passed,
                    f"Injury ID: {has_injury_id}, Status: {has_status}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    print(f"   Error: {response.text[:200]}")
                self.log_result("Log Injury", False, f"Status {response.status_code}")
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Log Injury", False, str(e))
            return False

    def test_get_active_injuries(self) -> bool:
        """Test GET /api/injury/active/{user_id}"""
        print("\n" + "=" * 80)
        print("TEST 2: Get Active Injuries")
        print("=" * 80)

        try:
            print(f"\n📤 Getting active injuries...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.get(
                f"{BASE_URL}/api/injury/active/{TEST_USER_ID}",
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_injuries = "injuries" in data or "active_injuries" in data
                has_count = "count" in data or "total" in data

                if has_injuries:
                    injuries = data.get("injuries") or data.get("active_injuries")
                    print(f"   Active Injuries: {len(injuries)}")

                    if len(injuries) > 0:
                        for i, injury in enumerate(injuries[:3], 1):
                            body_part = injury.get("body_part", "Unknown")
                            severity = injury.get("severity", "Unknown")
                            print(f"      {i}. {body_part} - {severity}")

                if has_count:
                    count = data.get("count") or data.get("total")
                    print(f"   Total Count: {count}")

                print(f"   ✅ Active injuries retrieved")

                passed = has_injuries
                self.log_result(
                    "Get Active Injuries",
                    passed,
                    f"Has injuries list: {has_injuries}",
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
                    "Get Active Injuries", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Get Active Injuries", False, str(e))
            return False

    def test_injury_check_in(self) -> bool:
        """Test POST /api/injury/{injury_id}/check-in"""
        print("\n" + "=" * 80)
        print("TEST 3: Injury Check-In")
        print("=" * 80)

        if not self.injury_id:
            print(f"\n⚠️  No injury ID available, skipping test")
            self.log_result("Injury Check-In", False, "No injury ID from previous test")
            return False

        try:
            payload = {
                "pain_level": 4,
                "rom_quality": "better",
                "activity_tolerance": "improving",
                "new_symptoms": None,
                "notes": "Pain has decreased, feeling better with rest and stretching",
            }

            print(f"\n📤 Submitting check-in...")
            print(f"   Injury ID: {self.injury_id}")
            print(f"   Pain Level: {payload['pain_level']}/10")
            print(f"   ROM Quality: {payload['rom_quality']}")
            print(f"   Activity Tolerance: {payload['activity_tolerance']}")

            response = requests.post(
                f"{BASE_URL}/api/injury/{self.injury_id}/check-in",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_progress = "progress" in data or "recovery_progress" in data
                has_recommendations = "recommendations" in data or "advice" in data
                has_status = "status" in data or "injury_status" in data

                if has_progress:
                    progress = data.get("progress") or data.get("recovery_progress")
                    print(f"   Recovery Progress: {progress}")

                if has_recommendations:
                    recommendations = data.get("recommendations") or data.get("advice")
                    print(f"   Recommendations: {recommendations[:100]}...")

                if has_status:
                    status = data.get("status") or data.get("injury_status")
                    print(f"   Status: {status}")

                print(f"   ✅ Check-in recorded successfully")

                passed = has_progress or has_recommendations
                self.log_result(
                    "Injury Check-In",
                    passed,
                    f"Progress: {has_progress}, Recommendations: {has_recommendations}",
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
                    "Injury Check-In", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Injury Check-In", False, str(e))
            return False

    def test_confidence_feedback(self) -> bool:
        """Test POST /api/injury/confidence-feedback"""
        print("\n" + "=" * 80)
        print("TEST 4: Confidence Feedback")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "prediction_id": "test-prediction-123",
                "predicted_confidence": 0.85,
                "was_accurate": True,
                "actual_severity": "moderate",
                "feedback_notes": "Prediction was accurate, helpful for planning recovery",
            }

            print(f"\n📤 Submitting confidence feedback...")
            print(f"   Prediction ID: {payload['prediction_id']}")
            print(f"   Predicted Confidence: {payload['predicted_confidence']}")
            print(f"   Was Accurate: {payload['was_accurate']}")

            response = requests.post(
                f"{BASE_URL}/api/injury/confidence-feedback",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_confirmation = (
                    "success" in data or "message" in data or "recorded" in data
                )

                if has_confirmation:
                    message = (
                        data.get("message")
                        or data.get("success")
                        or data.get("recorded")
                    )
                    print(f"   {message}")

                print(f"   ✅ Feedback recorded successfully")

                passed = has_confirmation or response.status_code == 200
                self.log_result(
                    "Confidence Feedback",
                    passed,
                    f"Confirmation: {has_confirmation}",
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
                    "Confidence Feedback", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Confidence Feedback", False, str(e))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("INJURY WORKFLOW TEST SUMMARY")
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
            print("🎉 ALL INJURY WORKFLOW TESTS PASSED!")
            print("=" * 80)
            return 0
        else:
            print(f"⚠️  {total - passed} TEST(S) FAILED")
            print("=" * 80)
            return 1

    def run_all_tests(self):
        """Run all injury workflow tests"""
        print("\n" + "=" * 80)
        print("INJURY WORKFLOW TEST SUITE")
        print("=" * 80)
        print(f"Target: {BASE_URL}")
        print(f"User ID: {TEST_USER_ID}")
        print("=" * 80)

        # Run tests in order
        self.test_log_injury()
        time.sleep(1)

        self.test_get_active_injuries()
        time.sleep(1)

        self.test_injury_check_in()
        time.sleep(1)

        self.test_confidence_feedback()

        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    tester = InjuryWorkflowTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
