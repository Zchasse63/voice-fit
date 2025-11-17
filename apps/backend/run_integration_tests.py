#!/usr/bin/env python3
"""
Integration Test Runner with Server Management

Automatically starts the FastAPI server, runs integration tests, and stops the server.
Handles cleanup and error recovery.

Usage:
    python3 run_integration_tests.py                    # Run all integration tests
    python3 run_integration_tests.py --quick            # Run quick tests only
    python3 run_integration_tests.py --no-server-start  # Use existing server
"""

import argparse
import os
import signal
import subprocess
import sys
import time
from typing import Optional

import requests


class IntegrationTestRunner:
    def __init__(self, port: int = 8000, auto_start: bool = True):
        self.port = port
        self.auto_start = auto_start
        self.server_process: Optional[subprocess.Popen] = None
        self.base_url = f"http://localhost:{port}"

    def is_server_running(self) -> bool:
        """Check if server is running and responsive"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=2)
            return response.status_code == 200
        except:
            return False

    def wait_for_server(self, timeout: int = 30) -> bool:
        """Wait for server to become responsive"""
        print(f"\n⏳ Waiting for server to start (timeout: {timeout}s)...")

        start_time = time.time()
        attempts = 0

        while time.time() - start_time < timeout:
            attempts += 1

            if self.is_server_running():
                elapsed = time.time() - start_time
                print(f"✅ Server ready after {elapsed:.1f}s ({attempts} attempts)")
                return True

            time.sleep(1)

        print(f"❌ Server did not start within {timeout}s")
        return False

    def start_server(self) -> bool:
        """Start the FastAPI server"""
        print("\n" + "=" * 80)
        print("STARTING SERVER")
        print("=" * 80)

        # Check if server already running
        if self.is_server_running():
            print(f"✅ Server already running on port {self.port}")
            return True

        print(f"\n🚀 Starting server on port {self.port}...")

        try:
            # Start uvicorn server
            self.server_process = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "uvicorn",
                    "main:app",
                    "--host",
                    "0.0.0.0",
                    "--port",
                    str(self.port),
                    "--log-level",
                    "warning",  # Reduce noise
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.path.dirname(os.path.abspath(__file__)),
            )

            # Wait for server to be ready
            if self.wait_for_server():
                print(
                    f"✅ Server started successfully (PID: {self.server_process.pid})"
                )
                return True
            else:
                print(f"❌ Server failed to start")
                self.stop_server()
                return False

        except Exception as e:
            print(f"❌ Error starting server: {e}")
            return False

    def stop_server(self):
        """Stop the server gracefully"""
        if self.server_process:
            print(f"\n🛑 Stopping server (PID: {self.server_process.pid})...")

            try:
                # Try graceful shutdown first
                self.server_process.terminate()

                # Wait up to 5 seconds for graceful shutdown
                try:
                    self.server_process.wait(timeout=5)
                    print("✅ Server stopped gracefully")
                except subprocess.TimeoutExpired:
                    # Force kill if graceful shutdown fails
                    print("⚠️  Forcing server shutdown...")
                    self.server_process.kill()
                    self.server_process.wait()
                    print("✅ Server stopped (forced)")

            except Exception as e:
                print(f"⚠️  Error stopping server: {e}")

            self.server_process = None

    def run_test_file(self, test_file: str) -> tuple[bool, float]:
        """Run a single test file"""
        print(f"\n{'=' * 80}")
        print(f"Running: {test_file}")
        print(f"{'=' * 80}")

        start = time.time()

        try:
            result = subprocess.run(
                [sys.executable, test_file],
                cwd=os.path.dirname(os.path.abspath(__file__)),
                capture_output=False,
            )

            duration = time.time() - start
            success = result.returncode == 0

            return success, duration

        except Exception as e:
            print(f"\n❌ Error running test: {e}")
            duration = time.time() - start
            return False, duration

    def run_integration_tests(self, quick: bool = False):
        """Run all integration tests"""
        print("\n" + "=" * 80)
        print("INTEGRATION TEST SUITE")
        print("=" * 80)
        print(f"Mode: {'Quick' if quick else 'Full'}")
        print("=" * 80)

        results = []

        # Define test files to run
        if quick:
            test_files = [
                ("RAG + Redis Integration", "test_rag_redis_integration.py"),
            ]
        else:
            test_files = [
                ("RAG + Redis Integration", "test_rag_redis_integration.py"),
                ("Full Stack Integration", "test_full_stack_integration.py"),
                ("AI Coach", "test_ai_coach.py"),
                ("User Context Builder", "test_user_context_builder.py"),
                ("Analytics Endpoints", "test_analytics_endpoints.py"),
                ("Voice Session Workflow", "test_voice_session_workflow.py"),
                ("Injury Workflow", "test_injury_workflow.py"),
                ("Badge System", "test_badge_system.py"),
                ("Exercise Substitution", "test_exercise_substitution.py"),
                ("Adherence Monitoring", "test_adherence_monitoring.py"),
                ("Conversational Onboarding", "test_conversational_onboarding.py"),
            ]

        # Run each test file
        for test_name, test_file in test_files:
            # Check if file exists
            if not os.path.exists(test_file):
                print(f"\n⚠️  Skipping {test_name}: {test_file} not found")
                results.append(
                    {
                        "name": test_name,
                        "file": test_file,
                        "passed": None,
                        "duration": 0,
                    }
                )
                continue

            success, duration = self.run_test_file(test_file)
            results.append(
                {
                    "name": test_name,
                    "file": test_file,
                    "passed": success,
                    "duration": duration,
                }
            )

        # Print summary
        self.print_summary(results)

        # Return exit code
        passed = sum(1 for r in results if r["passed"] is True)
        total = sum(1 for r in results if r["passed"] is not None)

        return 0 if passed == total else 1

    def print_summary(self, results: list):
        """Print test summary"""
        print("\n\n" + "=" * 80)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 80)

        total = len(results)
        passed = sum(1 for r in results if r["passed"] is True)
        failed = sum(1 for r in results if r["passed"] is False)
        skipped = sum(1 for r in results if r["passed"] is None)

        for result in results:
            if result["passed"] is True:
                status = "✅ PASS"
            elif result["passed"] is False:
                status = "❌ FAIL"
            else:
                status = "⚠️  SKIP"

            duration_str = (
                f"{result['duration']:.1f}s" if result["duration"] > 0 else "N/A"
            )
            print(f"{status}: {result['name']:<40} {duration_str:>10}")

        print("\n" + "=" * 80)
        print(f"Total: {total} tests")
        print(f"  ✅ Passed:  {passed}")
        print(f"  ❌ Failed:  {failed}")
        print(f"  ⚠️  Skipped: {skipped}")
        print("=" * 80)

        if failed == 0 and skipped == 0:
            print("\n🎉 ALL INTEGRATION TESTS PASSED!")
        elif failed == 0:
            print(f"\n⚠️  All tests passed (with {skipped} skipped)")
        else:
            print(f"\n❌ {failed} TEST(S) FAILED")

    def run(self, quick: bool = False):
        """Main run method"""
        try:
            # Start server if needed
            if self.auto_start:
                if not self.start_server():
                    print("\n❌ Failed to start server - cannot run tests")
                    return 1
            else:
                print(f"\n⚠️  Using existing server (--no-server-start specified)")
                if not self.is_server_running():
                    print(f"❌ No server running on port {self.port}")
                    return 1

            # Run tests
            exit_code = self.run_integration_tests(quick=quick)

            return exit_code

        except KeyboardInterrupt:
            print("\n\n⚠️  Tests interrupted by user")
            return 1

        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            import traceback

            traceback.print_exc()
            return 1

        finally:
            # Always cleanup server if we started it
            if self.auto_start and self.server_process:
                self.stop_server()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Run integration tests with automatic server management"
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Run quick tests only (RAG + Redis integration)",
    )
    parser.add_argument(
        "--no-server-start",
        action="store_true",
        help="Don't start server automatically (use existing server)",
    )
    parser.add_argument(
        "--port", type=int, default=8000, help="Server port (default: 8000)"
    )

    args = parser.parse_args()

    # Create and run test runner
    runner = IntegrationTestRunner(port=args.port, auto_start=not args.no_server_start)

    exit_code = runner.run(quick=args.quick)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
