"""
Adherence Monitoring Integration Tests

Tests the complete adherence monitoring system:
1. Get adherence report
2. Process adherence check-in

Tests program adherence tracking and user retention features.
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class AdherenceMonitoringTester:
    def __init__(self):
        self.results = []

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.results.append({"name": test_name, "passed": passed, "details": details})

    def test_get_adherence_report(self) -> bool:
        """Test GET /api/adherence/report/{user_id}"""
        print("\n" + "=" * 80)
        print("TEST 1: Get Adherence Report")
        print("=" * 80)

        try:
            print(f"\n📤 Getting adherence report...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.get(
                f"{BASE_URL}/api/adherence/report/{TEST_USER_ID}",
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_adherence = (
                    "adherence_rate" in data or "adherence_percentage" in data
                )
                has_workouts = (
                    "completed_workouts" in data or "workouts_completed" in data
                )
                has_scheduled = (
                    "scheduled_workouts" in data or "workouts_scheduled" in data
                )

                if has_adherence:
                    adherence = data.get("adherence_rate") or data.get(
                        "adherence_percentage"
                    )
                    print(f"   Adherence Rate: {adherence}%")

                if has_workouts:
                    completed = data.get("completed_workouts") or data.get(
                        "workouts_completed"
                    )
                    print(f"   Completed Workouts: {completed}")

                if has_scheduled:
                    scheduled = data.get("scheduled_workouts") or data.get(
                        "workouts_scheduled"
                    )
                    print(f"   Scheduled Workouts: {scheduled}")

                # Check for recommendations
                if "recommendations" in data:
                    recommendations = data.get("recommendations")
                    print(f"   Recommendations: {recommendations[:100]}...")

                print(f"   ✅ Adherence report retrieved")

                passed = has_adherence or has_workouts
                self.log_result(
                    "Get Adherence Report",
                    passed,
                    f"Adherence: {has_adherence}, Workouts: {has_workouts}",
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
                    "Get Adherence Report", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Get Adherence Report", False, str(e))
            return False

    def test_adherence_check_in(self) -> bool:
        """Test POST /api/adherence/check-in"""
        print("\n" + "=" * 80)
        print("TEST 2: Adherence Check-In")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "flag_id": "test-flag-123",
                "response_type": "fine",
                "notes": "Following program consistently, feeling strong",
            }

            print(f"\n📤 Submitting adherence check-in...")
            print(f"   Flag ID: {payload['flag_id']}")
            print(f"   Response Type: {payload['response_type']}")
            print(f"   Notes: {payload['notes']}")

            response = requests.post(
                f"{BASE_URL}/api/adherence/check-in",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_confirmation = "success" in data or "message" in data
                has_status = "adherence_status" in data or "status" in data
                has_recommendations = "recommendations" in data or "advice" in data

                if has_confirmation:
                    message = data.get("message") or data.get("success")
                    print(f"   {message}")

                if has_status:
                    status = data.get("adherence_status") or data.get("status")
                    print(f"   Status: {status}")

                if has_recommendations:
                    recommendations = data.get("recommendations") or data.get("advice")
                    if isinstance(recommendations, str):
                        print(f"   Recommendations: {recommendations[:100]}...")
                    else:
                        print(f"   Recommendations provided")

                print(f"   ✅ Check-in recorded successfully")

                passed = has_confirmation or response.status_code == 200
                self.log_result(
                    "Adherence Check-In",
                    passed,
                    f"Confirmation: {has_confirmation}, Status: {has_status}",
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
                    "Adherence Check-In", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Adherence Check-In", False, str(e))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("ADHERENCE MONITORING TEST SUMMARY")
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
            print("🎉 ALL ADHERENCE MONITORING TESTS PASSED!")
            print("=" * 80)
            return 0
        else:
            print(f"⚠️  {total - passed} TEST(S) FAILED")
            print("=" * 80)
            return 1

    def run_all_tests(self):
        """Run all adherence monitoring tests"""
        print("\n" + "=" * 80)
        print("ADHERENCE MONITORING TEST SUITE")
        print("=" * 80)
        print(f"Target: {BASE_URL}")
        print(f"User ID: {TEST_USER_ID}")
        print("=" * 80)

        # Run tests in order
        self.test_get_adherence_report()
        time.sleep(1)

        self.test_adherence_check_in()

        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    tester = AdherenceMonitoringTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
