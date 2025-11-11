"""
Master Test Runner

Executes all backend tests in the proper order and generates a comprehensive report.
"""

import os
import sys
import subprocess
import time
from datetime import datetime
from typing import List, Tuple

class TestRunner:
    def __init__(self):
        self.results = []
        self.start_time = None
        self.end_time = None
    
    def run_test(self, test_name: str, test_file: str) -> Tuple[bool, float]:
        """Run a single test file and return (success, duration)"""
        print(f"\n{'='*80}")
        print(f"Running: {test_name}")
        print(f"File: {test_file}")
        print(f"{'='*80}")
        
        start = time.time()
        
        try:
            result = subprocess.run(
                [sys.executable, test_file],
                cwd=os.path.dirname(os.path.abspath(__file__)),
                capture_output=False,
                text=True
            )
            
            duration = time.time() - start
            success = result.returncode == 0
            
            return success, duration
            
        except Exception as e:
            print(f"\n❌ Error running test: {e}")
            duration = time.time() - start
            return False, duration
    
    def run_all_tests(self):
        """Run all tests in order"""
        self.start_time = datetime.now()
        
        print("\n" + "="*80)
        print("VOICEFIT BACKEND TEST SUITE")
        print("="*80)
        print(f"Started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        
        # Define test phases
        phases = [
            {
                "name": "Phase 1: Service Unit Tests",
                "tests": [
                    ("Weather Service", "test_weather_service.py"),
                    ("GAP Calculator", "test_gap_calculator.py"),
                    ("Volume Tracking", "test_volume_tracking.py"),
                    ("Fatigue Monitoring", "test_fatigue_monitoring.py"),
                    ("Deload Recommendation", "test_deload_service.py"),
                ]
            },
            {
                "name": "Phase 2: API Endpoint Tests",
                "tests": [
                    ("Running Endpoints", "test_running_endpoints.py"),
                    ("Workout Insights", "test_workout_insights.py"),
                    ("Program Generation", "test_program_generation.py"),
                    ("Analytics Endpoints", "test_analytics_endpoints.py"),
                    ("AI Coach", "test_ai_coach.py"),
                ]
            },
            {
                "name": "Phase 3: Integration Tests",
                "tests": [
                    ("User Seed Data", "test_user_seed.py"),
                    ("UserContextBuilder", "test_user_context_builder.py"),
                    ("Full Stack Integration", "test_full_stack_integration.py"),
                    ("Running Workflow", "test_running_workflow.py"),
                ]
            },
            {
                "name": "Phase 4: Performance Tests",
                "tests": [
                    ("Latency Tests", "test_latency.py"),
                    ("Load Tests", "test_load.py"),
                ]
            }
        ]
        
        # Run all phases
        for phase in phases:
            print(f"\n\n{'='*80}")
            print(f"🚀 {phase['name']}")
            print(f"{'='*80}")
            
            phase_start = time.time()
            
            for test_name, test_file in phase['tests']:
                # Check if test file exists
                if not os.path.exists(test_file):
                    print(f"\n⚠️  Skipping {test_name}: {test_file} not found")
                    self.results.append({
                        "phase": phase['name'],
                        "name": test_name,
                        "file": test_file,
                        "success": None,
                        "duration": 0,
                        "status": "SKIPPED"
                    })
                    continue
                
                success, duration = self.run_test(test_name, test_file)
                
                self.results.append({
                    "phase": phase['name'],
                    "name": test_name,
                    "file": test_file,
                    "success": success,
                    "duration": duration,
                    "status": "PASS" if success else "FAIL"
                })
            
            phase_duration = time.time() - phase_start
            print(f"\n{phase['name']} completed in {phase_duration:.2f}s")
        
        self.end_time = datetime.now()
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        # Group by phase
        phases = {}
        for result in self.results:
            phase = result['phase']
            if phase not in phases:
                phases[phase] = []
            phases[phase].append(result)
        
        # Print phase summaries
        for phase_name, tests in phases.items():
            print(f"\n{phase_name}:")
            print("-" * 80)
            
            for test in tests:
                status_icon = {
                    "PASS": "✅",
                    "FAIL": "❌",
                    "SKIPPED": "⚠️ "
                }[test['status']]
                
                duration_str = f"{test['duration']:.2f}s" if test['duration'] > 0 else "N/A"
                print(f"  {status_icon} {test['name']:<40} {duration_str:>10}")
        
        # Overall statistics
        print("\n" + "="*80)
        print("OVERALL STATISTICS")
        print("="*80)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r['status'] == 'PASS')
        failed = sum(1 for r in self.results if r['status'] == 'FAIL')
        skipped = sum(1 for r in self.results if r['status'] == 'SKIPPED')
        
        total_duration = sum(r['duration'] for r in self.results)
        
        print(f"\nTotal Tests: {total}")
        print(f"  ✅ Passed:  {passed} ({passed/total*100:.1f}%)")
        print(f"  ❌ Failed:  {failed} ({failed/total*100:.1f}%)")
        print(f"  ⚠️  Skipped: {skipped} ({skipped/total*100:.1f}%)")
        
        print(f"\nTotal Duration: {total_duration:.2f}s ({total_duration/60:.1f} minutes)")
        print(f"Started:  {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Finished: {self.end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Final verdict
        print("\n" + "="*80)
        if failed == 0 and skipped == 0:
            print("🎉 ALL TESTS PASSED!")
            print("="*80)
            return 0
        elif failed == 0:
            print(f"⚠️  ALL TESTS PASSED (with {skipped} skipped)")
            print("="*80)
            return 0
        else:
            print(f"❌ {failed} TEST(S) FAILED")
            print("="*80)
            print("\nFailed Tests:")
            for result in self.results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['name']} ({result['file']})")
            return 1


def main():
    """Main entry point"""
    runner = TestRunner()
    exit_code = runner.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

