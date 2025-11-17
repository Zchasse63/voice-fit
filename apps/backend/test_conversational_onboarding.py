"""
Conversational Onboarding Integration Tests

Tests the conversational onboarding system:
1. Multi-turn conversation flow
2. State management
3. Context retention
4. Questionnaire completion

Tests user acquisition and first-time experience.
"""

import os
import sys
import time

import requests
from dotenv import load_dotenv
from test_config import TEST_USER_ID, get_test_auth_headers

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class ConversationalOnboardingTester:
    def __init__(self):
        self.results = []
        self.conversation_state = {}

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result"""
        self.results.append({"name": test_name, "passed": passed, "details": details})

    def test_conversational_onboarding(self) -> bool:
        """Test POST /api/onboarding/conversational"""
        print("\n" + "=" * 80)
        print("TEST 1: Conversational Onboarding")
        print("=" * 80)

        try:
            # Turn 1: Initial greeting
            payload_1 = {
                "current_step": "greeting",
                "user_context": {},
                "previous_answer": "I want to get started with a training program",
            }

            print(f"\n📤 Turn 1: Initial greeting...")
            print(f"   Step: {payload_1['current_step']}")
            print(f"   Answer: {payload_1['previous_answer']}")

            response_1 = requests.post(
                f"{BASE_URL}/api/onboarding/conversational",
                json=payload_1,
                headers=get_test_auth_headers(),
                timeout=30,
            )

            print(f"\n📥 Response:")
            print(f"   Status: {response_1.status_code}")

            if response_1.status_code == 200:
                data_1 = response_1.json()

                has_response = "response" in data_1 or "message" in data_1
                has_next_step = "next_step" in data_1 or "current_step" in data_1

                if has_response:
                    response_text = data_1.get("response") or data_1.get("message")
                    print(f"   AI Response: {response_text[:150]}...")

                if has_next_step:
                    next_step = data_1.get("next_step") or data_1.get("current_step")
                    print(f"   Next Step: {next_step}")
                    self.conversation_state["next_step"] = next_step

                # Store context for next turn
                if has_response:
                    self.conversation_state["user_context"] = {
                        "greeting_completed": True
                    }

                print(f"   ✅ Turn 1 successful")

                # Turn 2: Provide experience level
                time.sleep(1)

                payload_2 = {
                    "current_step": self.conversation_state.get(
                        "next_step", "experience"
                    ),
                    "user_context": {"greeting_completed": True},
                    "previous_answer": "I'm an intermediate lifter, been training for about 3 years",
                }

                print(f"\n📤 Turn 2: Experience level...")
                print(f"   Step: {payload_2['current_step']}")
                print(f"   Answer: {payload_2['previous_answer']}")

                response_2 = requests.post(
                    f"{BASE_URL}/api/onboarding/conversational",
                    json=payload_2,
                    headers=get_test_auth_headers(),
                    timeout=30,
                )

                print(f"\n📥 Response:")
                print(f"   Status: {response_2.status_code}")

                if response_2.status_code == 200:
                    data_2 = response_2.json()

                    if "response" in data_2 or "message" in data_2:
                        response_text = data_2.get("response") or data_2.get("message")
                        print(f"   AI Response: {response_text[:150]}...")

                    if "next_step" in data_2:
                        next_step = data_2.get("next_step")
                        print(f"   Next Step: {next_step}")

                    print(f"   ✅ Turn 2 successful")

                    # Turn 3: Provide goals
                    time.sleep(1)

                    # Update context for next turn
                    if self.conversation_state.get("user_context"):
                        self.conversation_state["user_context"].update(
                            {
                                "experience_level": "intermediate",
                                "training_age_years": 3,
                            }
                        )

                    payload_3 = {
                        "current_step": data_2.get("next_step", "goals"),
                        "user_context": {
                            "greeting_completed": True,
                            "experience_level": "intermediate",
                            "training_age_years": 3,
                        },
                        "previous_answer": "I want to build muscle and get stronger",
                    }

                    print(f"\n📤 Turn 3: Goals...")
                    print(f"   Step: {payload_3['current_step']}")
                    print(f"   Answer: {payload_3['previous_answer']}")

                    response_3 = requests.post(
                        f"{BASE_URL}/api/onboarding/conversational",
                        json=payload_3,
                        headers=get_test_auth_headers(),
                        timeout=30,
                    )

                    print(f"\n📥 Response:")
                    print(f"   Status: {response_3.status_code}")

                    if response_3.status_code == 200:
                        data_3 = response_3.json()

                        if "response" in data_3 or "message" in data_3:
                            response_text = data_3.get("response") or data_3.get(
                                "message"
                            )
                            print(f"   AI Response: {response_text[:150]}...")

                        if "next_step" in data_3:
                            next_step = data_3.get("next_step")
                            print(f"   Next Step: {next_step}")

                        # Check if questionnaire is completed
                        is_complete = data_3.get("completed") or data_3.get(
                            "questionnaire_complete"
                        )
                        if is_complete:
                            print(f"   ✅ Questionnaire completed!")

                        print(f"   ✅ Turn 3 successful")

                        # All three turns successful
                        passed = True
                        self.log_result(
                            "Conversational Onboarding",
                            passed,
                            "3 conversation turns completed successfully",
                        )
                        return passed
                    else:
                        print(f"   ❌ Turn 3 failed: {response_3.status_code}")
                        self.log_result(
                            "Conversational Onboarding",
                            False,
                            f"Turn 3 failed: {response_3.status_code}",
                        )
                        return False
                else:
                    print(f"   ❌ Turn 2 failed: {response_2.status_code}")
                    self.log_result(
                        "Conversational Onboarding",
                        False,
                        f"Turn 2 failed: {response_2.status_code}",
                    )
                    return False
            else:
                print(f"   ❌ Turn 1 failed: {response_1.status_code}")
                try:
                    error = response_1.json()
                    print(f"   Error: {error.get('detail', 'Unknown')}")
                except:
                    pass
                self.log_result(
                    "Conversational Onboarding",
                    False,
                    f"Turn 1 failed: {response_1.status_code}",
                )
                return False

        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            import traceback

            traceback.print_exc()
            self.log_result("Conversational Onboarding", False, str(e))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("CONVERSATIONAL ONBOARDING TEST SUMMARY")
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
            print("🎉 ALL CONVERSATIONAL ONBOARDING TESTS PASSED!")
            print("=" * 80)
            return 0
        else:
            print(f"⚠️  {total - passed} TEST(S) FAILED")
            print("=" * 80)
            return 1

    def run_all_tests(self):
        """Run all conversational onboarding tests"""
        print("\n" + "=" * 80)
        print("CONVERSATIONAL ONBOARDING TEST SUITE")
        print("=" * 80)
        print(f"Target: {BASE_URL}")
        print(f"User ID: {TEST_USER_ID}")
        print("=" * 80)

        # Run test
        self.test_conversational_onboarding()

        # Print summary
        return self.print_summary()


def main():
    """Main entry point"""
    tester = ConversationalOnboardingTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
