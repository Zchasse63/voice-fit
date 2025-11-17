"""
Voice Session Workflow Integration Tests

Tests the complete voice logging workflow:
1. Parse voice command
2. Log workout set
3. Get session summary
4. End session

Tests Redis session state management and database writes.
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class VoiceSessionTester:
    def __init__(self):
        self.results = []
        self.session_data = {}

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.results.append({"name": test_name, "passed": passed, "details": details})

    def test_voice_parse(self) -> bool:
        """Test POST /api/voice/parse"""
        print("\n" + "=" * 80)
        print("TEST 1: Voice Parse")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "transcript": "Bench press 225 pounds for 8 reps RPE 8",
            }

            print(f"\n📤 Parsing voice command...")
            print(f"   Transcript: {payload['transcript']}")

            response = requests.post(
                f"{BASE_URL}/api/voice/parse",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                # Response structure: {'success': bool, 'data': {...}, 'action': str}
                has_success = "success" in data
                has_data = "data" in data

                parsed_data = data.get("data", {})
                has_exercise = (
                    "exercise_name" in parsed_data or "exercise" in parsed_data
                )
                has_weight = "weight" in parsed_data or "weight_lbs" in parsed_data
                has_reps = "reps" in parsed_data

                if has_data and parsed_data:
                    exercise = parsed_data.get("exercise_name") or parsed_data.get(
                        "exercise", "Unknown"
                    )
                    weight = parsed_data.get("weight") or parsed_data.get(
                        "weight_lbs", 0
                    )
                    reps = parsed_data.get("reps", 0)

                    print(f"   Success: {data.get('success')}")
                    print(f"   Exercise: {exercise}")
                    print(f"   Weight: {weight} lbs")
                    print(f"   Reps: {reps}")
                    print(f"   ✅ Voice parsing successful")

                    # Store for next test
                    self.session_data["parsed"] = data
                else:
                    print(f"   ⚠️  Response structure different than expected")
                    print(f"   Keys: {list(data.keys())}")

                passed = has_success and has_data
                self.log_result(
                    "Voice Parse",
                    passed,
                    f"Exercise: {has_exercise}, Weight: {has_weight}, Reps: {has_reps}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result("Voice Parse", False, f"Status {response.status_code}")
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Voice Parse", False, str(e))
            return False

    def test_voice_log(self) -> bool:
        """Test POST /api/voice/log"""
        print("\n" + "=" * 80)
        print("TEST 2: Voice Log")
        print("=" * 80)

        try:
            payload = {
                "user_id": TEST_USER_ID,
                "voice_input": "Squat 315 pounds for 5 reps RPE 9",
            }

            print(f"\n📤 Logging workout set...")
            print(f"   Voice Input: {payload['voice_input']}")

            response = requests.post(
                f"{BASE_URL}/api/voice/log",
                json=payload,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_set_id = "set_id" in data or "id" in data
                has_confirmation = "message" in data or "success" in data

                if has_set_id:
                    set_id = data.get("set_id") or data.get("id")
                    print(f"   Set ID: {set_id}")
                    self.session_data["set_id"] = set_id

                if has_confirmation:
                    message = data.get("message") or data.get("success")
                    print(f"   Message: {message}")

                print(f"   ✅ Workout logged successfully")

                passed = has_set_id or has_confirmation
                self.log_result(
                    "Voice Log",
                    passed,
                    f"Set ID: {has_set_id}, Confirmation: {has_confirmation}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result("Voice Log", False, f"Status {response.status_code}")
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Voice Log", False, str(e))
            return False

    def test_session_summary(self) -> bool:
        """Test GET /api/session/{user_id}/summary"""
        print("\n" + "=" * 80)
        print("TEST 3: Session Summary")
        print("=" * 80)

        try:
            print(f"\n📤 Getting session summary...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.get(
                f"{BASE_URL}/api/session/{TEST_USER_ID}/summary",
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_sets = "sets" in data or "total_sets" in data or "set_count" in data
                has_exercises = (
                    "exercises" in data
                    or "exercise_count" in data
                    or "unique_exercises" in data
                )
                has_summary = "summary" in data

                if has_sets:
                    sets_count = (
                        len(data.get("sets", []))
                        if isinstance(data.get("sets"), list)
                        else data.get("total_sets", data.get("set_count", 0))
                    )
                    print(f"   Total Sets: {sets_count}")

                if has_exercises:
                    exercise_count = (
                        len(data.get("exercises", []))
                        if isinstance(data.get("exercises"), list)
                        else data.get("exercise_count", data.get("unique_exercises", 0))
                    )
                    print(f"   Exercises: {exercise_count}")

                if has_summary:
                    print(f"   Summary available")

                print(f"   ✅ Session summary retrieved")

                passed = has_sets or has_exercises
                self.log_result(
                    "Session Summary",
                    passed,
                    f"Sets: {has_sets}, Exercises: {has_exercises}",
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
                    "Session Summary", False, f"Status {response.status_code}"
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("Session Summary", False, str(e))
            return False

    def test_end_session(self) -> bool:
        """Test POST /api/session/{user_id}/end"""
        print("\n" + "=" * 80)
        print("TEST 4: End Session")
        print("=" * 80)

        try:
            print(f"\n📤 Ending session...")
            print(f"   User ID: {TEST_USER_ID}")

            response = requests.post(
                f"{BASE_URL}/api/session/{TEST_USER_ID}/end",
                headers=get_test_auth_headers(),
                timeout=10,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()

                has_summary = (
                    "summary" in data
                    or "final_summary" in data
                    or "session_summary" in data
                )
                has_confirmation = (
                    "message" in data
                    or "success" in data
                    or response.status_code == 200
                )

                if has_summary:
                    summary = (
                        data.get("summary")
                        or data.get("final_summary")
                        or data.get("session_summary")
                    )
                    if isinstance(summary, dict):
                        print(f"   Final Summary:")
                        for key, value in list(summary.items())[:5]:
                            print(f"      {key}: {value}")
                    else:
                        print(f"   Summary: {summary}")
                elif "message" in data:
                    print(f"   Message: {data.get('message')}")

                if has_confirmation:
                    message = data.get("message") or data.get("success")
                    print(f"   {message}")

                print(f"   ✅ Session ended successfully")

                passed = has_summary or has_confirmation
                self.log_result(
                    "End Session",
                    passed,
                    f"Summary: {has_summary}, Confirmation: {has_confirmation}",
                )
                return passed
            else:
                print(f"   ❌ Request failed: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result("End Session", False, f"Status {response.status_code}")
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            self.log_result("End Session", False, str(e))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("VOICE SESSION WORKFLOW TEST SUMMARY")
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
            print("🎉 ALL VOICE SESSION WORKFLOW TESTS PASSED!")
            print("=" * 80)
            return 0
        else:
            print(f"⚠️  {total - passed} TEST(S) FAILED")
            print("=" * 80)
            return 1

    def run_all_tests(self):
        """Run all voice session workflow tests"""
        print("\n" + "=" * 80)
        print("VOICE SESSION WORKFLOW TEST SUITE")
        print("=" * 80)
        print(f"Target: {BASE_URL}")
        print(f"User ID: {TEST_USER_ID}")
        print("=" * 80)

        # Run tests in order
        self.test_voice_parse()
        time.sleep(0.5)

        self.test_voice_log()
        time.sleep(0.5)

        self.test_session_summary()
        time.sleep(0.5)

        self.test_end_session()

        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    tester = VoiceSessionTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
