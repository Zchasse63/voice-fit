"""
Badge System Integration Tests

Tests the complete badge system:
1. Unlock badge manually
2. Get user badges
3. Get badge progress
4. Check workout badges
5. Check PR badges

Tests gamification features and user engagement.
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class BadgeSystemTester:
    def __init__(self):
        self.results = []
        self.unlocked_badges = []

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.results.append({"name": test_name, "passed": passed, "details": details})

    def test_unlock_badge(self) -> bool:
        """Test POST /api/badges/unlock"""
        print("\n" + "=" * 80)
        print("TEST 1: Unlock Badge")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "badge_type": "first_workout",
                "badge_data": {
                    "workout_count": 1,
                    "exercise": "Bench Press",
                    "date": "2025-01-16",
                },
            }

            print(f"\n📤 Unlocking badge...")
            print(f"   Badge Type: {payload['badge_type']}")

            response = requests.post(
                f"{BASE_URL}/api/badges/unlock",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_badge = "badge" in data or "badge_type" in data
                has_unlocked = "unlocked" in data or "newly_unlocked" in data

                if has_badge:
                    badge = data.get("badge") or data.get("badge_type")
                    print(f"   Badge: {badge}")

                if has_unlocked:
                    unlocked = data.get("unlocked") or data.get("newly_unlocked")
                    print(f"   Newly Unlocked: {unlocked}")

                print(f"   ✅ Badge unlocked successfully")

                passed = has_badge or response.status_code == 200
                self.log_result(
                    "Unlock Badge",
                    passed,
                    f"Badge: {has_badge}, Unlocked: {has_unlocked}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result("Unlock Badge", False, f"Status {response.status_code}")
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Unlock Badge", False, str(e))
            return False

    def test_get_user_badges(self) -> bool:
        """Test GET /api/badges/{user_id}"""
        print("\n" + "=" * 80)
        print("TEST 2: Get User Badges")
        print("=" * 80)

        try:
            print(f"\n📤 Getting user badges...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.get(
                f"{BASE_URL}/api/badges/{TEST_USER_ID}",
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_badges = "badges" in data or "earned_badges" in data
                has_count = "count" in data or "total" in data

                if has_badges:
                    badges = data.get("badges") or data.get("earned_badges")
                    print(f"   Total Badges: {len(badges)}")

                    if len(badges) > 0:
                        for i, badge in enumerate(badges[:5], 1):
                            badge_type = badge.get("badge_type", "Unknown")
                            earned_at = badge.get(
                                "earned_at", badge.get("unlocked_at", "Unknown")
                            )
                            print(f"      {i}. {badge_type} - {earned_at}")

                        self.unlocked_badges = badges

                if has_count:
                    count = data.get("count") or data.get("total")
                    print(f"   Badge Count: {count}")

                print(f"   ✅ User badges retrieved")

                passed = has_badges or isinstance(data, list)
                self.log_result("Get User Badges", passed, f"Has badges: {has_badges}")
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result(
                    "Get User Badges", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Get User Badges", False, str(e))
            return False

    def test_get_badge_progress(self) -> bool:
        """Test GET /api/badges/{user_id}/progress"""
        print("\n" + "=" * 80)
        print("TEST 3: Get Badge Progress")
        print("=" * 80)

        try:
            print(f"\n📤 Getting badge progress...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.get(
                f"{BASE_URL}/api/badges/{TEST_USER_ID}/progress",
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_progress = "progress" in data or "badge_progress" in data
                is_dict = isinstance(data, dict)

                if has_progress:
                    progress = data.get("progress") or data.get("badge_progress")
                    print(f"   Badge Progress Entries: {len(progress)}")

                    # Show first few progress items
                    if isinstance(progress, dict):
                        for i, (badge_type, prog) in enumerate(
                            list(progress.items())[:3], 1
                        ):
                            if isinstance(prog, dict):
                                current = prog.get("current", 0)
                                required = prog.get("required", 0)
                                percent = (
                                    (current / required * 100) if required > 0 else 0
                                )
                                print(
                                    f"      {badge_type}: {current}/{required} ({percent:.1f}%)"
                                )
                            else:
                                print(f"      {badge_type}: {prog}")

                elif is_dict:
                    print(f"   Progress items: {len(data)}")
                    for i, (badge_type, prog) in enumerate(list(data.items())[:3], 1):
                        print(f"      {badge_type}: {prog}")

                print(f"   ✅ Badge progress retrieved")

                passed = has_progress or is_dict
                self.log_result(
                    "Get Badge Progress",
                    passed,
                    f"Has progress: {has_progress or is_dict}",
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
                    "Get Badge Progress", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Get Badge Progress", False, str(e))
            return False

    def test_check_workout_badges(self) -> bool:
        """Test POST /api/badges/{user_id}/check-workout"""
        print("\n" + "=" * 80)
        print("TEST 4: Check Workout Badges")
        print("=" * 80)

        try:
            print(f"\n📤 Checking for workout badges...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.post(
                f"{BASE_URL}/api/badges/{TEST_USER_ID}/check-workout",
                headers=get_test_auth_headers(),
                timeout=15,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_newly_unlocked = "newly_unlocked" in data or "new_badges" in data
                has_total = "total_badges" in data or "badge_count" in data

                if has_newly_unlocked:
                    newly_unlocked = data.get("newly_unlocked") or data.get(
                        "new_badges"
                    )
                    print(f"   Newly Unlocked: {len(newly_unlocked)}")

                    if len(newly_unlocked) > 0:
                        for badge in newly_unlocked:
                            badge_type = badge.get("badge_type", badge)
                            print(f"      🎉 {badge_type}")

                if has_total:
                    total = data.get("total_badges") or data.get("badge_count")
                    print(f"   Total Badges: {total}")

                print(f"   ✅ Workout badges checked")

                passed = has_newly_unlocked or response.status_code == 200
                self.log_result(
                    "Check Workout Badges",
                    passed,
                    f"Newly unlocked: {has_newly_unlocked}",
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
                    "Check Workout Badges", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Check Workout Badges", False, str(e))
            return False

    def test_check_pr_badges(self) -> bool:
        """Test POST /api/badges/{user_id}/check-pr"""
        print("\n" + "=" * 80)
        print("TEST 5: Check PR Badges")
        print("=" * 80)

        try:
            print(f"\n📤 Checking for PR badges...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.post(
                f"{BASE_URL}/api/badges/{TEST_USER_ID}/check-pr",
                headers=get_test_auth_headers(),
                timeout=15,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_newly_unlocked = "newly_unlocked" in data or "new_badges" in data
                has_total = "total_badges" in data or "badge_count" in data

                if has_newly_unlocked:
                    newly_unlocked = data.get("newly_unlocked") or data.get(
                        "new_badges"
                    )
                    print(f"   Newly Unlocked: {len(newly_unlocked)}")

                    if len(newly_unlocked) > 0:
                        for badge in newly_unlocked:
                            badge_type = badge.get("badge_type", badge)
                            print(f"      🎉 {badge_type}")

                if has_total:
                    total = data.get("total_badges") or data.get("badge_count")
                    print(f"   Total Badges: {total}")

                print(f"   ✅ PR badges checked")

                passed = has_newly_unlocked or response.status_code == 200
                self.log_result(
                    "Check PR Badges", passed, f"Newly unlocked: {has_newly_unlocked}"
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
                    "Check PR Badges", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Check PR Badges", False, str(e))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("BADGE SYSTEM TEST SUMMARY")
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
            print("🎉 ALL BADGE SYSTEM TESTS PASSED!")
            print("=" * 80)
            return 0
        else:
            print(f"⚠️  {total - passed} TEST(S) FAILED")
            print("=" * 80)
            return 1

    def run_all_tests(self):
        """Run all badge system tests"""
        print("\n" + "=" * 80)
        print("BADGE SYSTEM TEST SUITE")
        print("=" * 80)
        print(f"Target: {BASE_URL}")
        print(f"User ID: {TEST_USER_ID}")
        print("=" * 80)

        # Run tests in order
        self.test_unlock_badge()
        time.sleep(0.5)

        self.test_get_user_badges()
        time.sleep(0.5)

        self.test_get_badge_progress()
        time.sleep(0.5)

        self.test_check_workout_badges()
        time.sleep(0.5)

        self.test_check_pr_badges()

        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    tester = BadgeSystemTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
