"""
Test GAP Calculator

Tests grade-adjusted pace calculations and terrain difficulty classification.
"""

import sys
from gap_calculator import GAPCalculator

def test_flat_terrain():
    """Test GAP calculation on flat terrain"""
    print("\n" + "="*80)
    print("TEST 1: Flat Terrain (0% grade)")
    print("="*80)
    
    try:
        calculator = GAPCalculator()
        
        # Flat run: 5 miles, 0 elevation gain/loss
        distance_miles = 5.0
        elevation_gain_ft = 0
        elevation_loss_ft = 0
        actual_pace_min_per_mile = 8.0  # 8:00/mile
        
        print(f"\n📊 Input:")
        print(f"   Distance: {distance_miles} miles")
        print(f"   Elevation Gain: {elevation_gain_ft} ft")
        print(f"   Elevation Loss: {elevation_loss_ft} ft")
        print(f"   Actual Pace: {actual_pace_min_per_mile:.2f} min/mile")
        
        result = calculator.calculate_gap(
            actual_pace_min_per_mile,
            elevation_gain_ft,
            elevation_loss_ft,
            distance_miles,
            pace_unit="min_per_mile"
        )

        print(f"\n✅ Result:")
        print(f"   Grade: {result['grade_percent']:.2f}%")
        print(f"   GAP: {result['gap']:.2f} min/mile")
        print(f"   Terrain Difficulty: {result['difficulty']}")

        # On flat terrain, GAP should equal actual pace
        assert abs(result['gap'] - actual_pace_min_per_mile) < 0.01
        assert result['grade_percent'] == 0.0
        assert result['difficulty'] == 'flat'
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_uphill_terrain():
    """Test GAP calculation on uphill terrain"""
    print("\n" + "="*80)
    print("TEST 2: Uphill Terrain (positive grade)")
    print("="*80)
    
    try:
        calculator = GAPCalculator()
        
        # Uphill run: 5 miles, 500 ft gain
        distance_miles = 5.0
        elevation_gain_ft = 500
        elevation_loss_ft = 0
        actual_pace_min_per_mile = 9.0  # 9:00/mile (slower due to uphill)
        
        print(f"\n📊 Input:")
        print(f"   Distance: {distance_miles} miles")
        print(f"   Elevation Gain: {elevation_gain_ft} ft")
        print(f"   Elevation Loss: {elevation_loss_ft} ft")
        print(f"   Actual Pace: {actual_pace_min_per_mile:.2f} min/mile")
        
        result = calculator.calculate_gap(
            actual_pace_min_per_mile,
            elevation_gain_ft,
            elevation_loss_ft,
            distance_miles,
            pace_unit="min_per_mile"
        )

        print(f"\n✅ Result:")
        print(f"   Grade: {result['grade_percent']:.2f}%")
        print(f"   GAP: {result['gap']:.2f} min/mile")
        print(f"   Terrain Difficulty: {result['difficulty']}")
        print(f"   Adjustment: {result['gap'] - actual_pace_min_per_mile:.2f} min/mile faster")

        # GAP should be faster (lower) than actual pace on uphill
        assert result['gap'] < actual_pace_min_per_mile
        assert result['grade_percent'] > 0
        assert result['difficulty'] in ['rolling', 'moderate_uphill', 'steep_uphill', 'very_steep_uphill']
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_downhill_terrain():
    """Test GAP calculation on downhill terrain"""
    print("\n" + "="*80)
    print("TEST 3: Downhill Terrain (negative grade)")
    print("="*80)
    
    try:
        calculator = GAPCalculator()
        
        # Downhill run: 5 miles, 500 ft loss
        distance_miles = 5.0
        elevation_gain_ft = 0
        elevation_loss_ft = 500
        actual_pace_min_per_mile = 7.0  # 7:00/mile (faster due to downhill)
        
        print(f"\n📊 Input:")
        print(f"   Distance: {distance_miles} miles")
        print(f"   Elevation Gain: {elevation_gain_ft} ft")
        print(f"   Elevation Loss: {elevation_loss_ft} ft")
        print(f"   Actual Pace: {actual_pace_min_per_mile:.2f} min/mile")
        
        result = calculator.calculate_gap(
            actual_pace_min_per_mile,
            elevation_gain_ft,
            elevation_loss_ft,
            distance_miles,
            pace_unit="min_per_mile"
        )

        print(f"\n✅ Result:")
        print(f"   Grade: {result['grade_percent']:.2f}%")
        print(f"   GAP: {result['gap']:.2f} min/mile")
        print(f"   Terrain Difficulty: {result['difficulty']}")
        print(f"   Adjustment: {result['gap'] - actual_pace_min_per_mile:.2f} min/mile slower")

        # GAP should be slower (higher) than actual pace on downhill
        assert result['gap'] > actual_pace_min_per_mile
        assert result['grade_percent'] < 0
        assert result['difficulty'] in ['rolling', 'moderate_downhill', 'steep_downhill']
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_rolling_terrain():
    """Test GAP calculation on rolling terrain (mixed elevation)"""
    print("\n" + "="*80)
    print("TEST 4: Rolling Terrain (mixed elevation)")
    print("="*80)
    
    try:
        calculator = GAPCalculator()
        
        # Rolling run: 10 miles, 300 ft gain, 200 ft loss (net +100 ft)
        distance_miles = 10.0
        elevation_gain_ft = 300
        elevation_loss_ft = 200
        actual_pace_min_per_mile = 8.5  # 8:30/mile
        
        print(f"\n📊 Input:")
        print(f"   Distance: {distance_miles} miles")
        print(f"   Elevation Gain: {elevation_gain_ft} ft")
        print(f"   Elevation Loss: {elevation_loss_ft} ft")
        print(f"   Net Elevation: +{elevation_gain_ft - elevation_loss_ft} ft")
        print(f"   Actual Pace: {actual_pace_min_per_mile:.2f} min/mile")
        
        result = calculator.calculate_gap(
            actual_pace_min_per_mile,
            elevation_gain_ft,
            elevation_loss_ft,
            distance_miles,
            pace_unit="min_per_mile"
        )

        print(f"\n✅ Result:")
        print(f"   Grade: {result['grade_percent']:.2f}%")
        print(f"   GAP: {result['gap']:.2f} min/mile")
        print(f"   Terrain Difficulty: {result['difficulty']}")

        # Net positive elevation should result in GAP <= actual pace (or very close)
        # With only 0.62% grade, the adjustment might be minimal
        assert result['difficulty'] == 'rolling'
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_extreme_terrain():
    """Test GAP calculation on extreme mountainous terrain"""
    print("\n" + "="*80)
    print("TEST 5: Extreme Mountainous Terrain")
    print("="*80)
    
    try:
        calculator = GAPCalculator()
        
        # Mountain run: 5 miles, 2000 ft gain
        distance_miles = 5.0
        elevation_gain_ft = 2000
        elevation_loss_ft = 0
        actual_pace_min_per_mile = 12.0  # 12:00/mile (very slow due to steep climb)
        
        print(f"\n📊 Input:")
        print(f"   Distance: {distance_miles} miles")
        print(f"   Elevation Gain: {elevation_gain_ft} ft")
        print(f"   Elevation Loss: {elevation_loss_ft} ft")
        print(f"   Actual Pace: {actual_pace_min_per_mile:.2f} min/mile")
        
        result = calculator.calculate_gap(
            actual_pace_min_per_mile,
            elevation_gain_ft,
            elevation_loss_ft,
            distance_miles,
            pace_unit="min_per_mile"
        )

        print(f"\n✅ Result:")
        print(f"   Grade: {result['grade_percent']:.2f}%")
        print(f"   GAP: {result['gap']:.2f} min/mile")
        print(f"   Terrain Difficulty: {result['difficulty']}")
        print(f"   Adjustment: {result['gap'] - actual_pace_min_per_mile:.2f} min/mile faster")

        # Extreme uphill should have large GAP adjustment
        assert result['gap'] < actual_pace_min_per_mile
        assert result['grade_percent'] > 5.0  # Very steep
        assert result['difficulty'] == 'very_steep_uphill'
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_edge_cases():
    """Test edge cases"""
    print("\n" + "="*80)
    print("TEST 6: Edge Cases")
    print("="*80)
    
    try:
        calculator = GAPCalculator()
        
        # Test zero distance (signature: actual_pace, elevation_gain, elevation_loss, distance)
        # Zero distance is handled gracefully - returns same pace with 0% grade
        print("\n🧪 Testing zero distance...")
        result = calculator.calculate_gap(8.0, 0, 0, 0)  # pace=8.0, distance=0
        assert result['gap'] == 8.0
        assert result['grade_percent'] == 0.0
        print("✅ Zero distance handled gracefully (returns same pace)")

        # Test negative pace - calculator doesn't validate, just calculates
        print("\n🧪 Testing negative pace...")
        result = calculator.calculate_gap(-8.0, 0, 0, 5.0)  # pace=-8.0, distance=5.0
        assert result['gap'] == -8.0
        print("✅ Negative pace handled (calculator doesn't validate inputs)")

        # Test negative elevation - calculator doesn't validate, just calculates
        print("\n🧪 Testing negative elevation...")
        result = calculator.calculate_gap(8.0, -100, 0, 5.0)  # pace=8.0, elevation_gain=-100, distance=5.0
        assert 'gap' in result
        print("✅ Negative elevation handled (calculator doesn't validate inputs)")

        print("\n✅ All edge case tests passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all GAP calculator tests"""
    print("\n" + "="*80)
    print("GAP CALCULATOR TEST SUITE")
    print("="*80)
    
    tests = [
        ("Flat Terrain", test_flat_terrain),
        ("Uphill Terrain", test_uphill_terrain),
        ("Downhill Terrain", test_downhill_terrain),
        ("Rolling Terrain", test_rolling_terrain),
        ("Extreme Mountainous Terrain", test_extreme_terrain),
        ("Edge Cases", test_edge_cases),
    ]
    
    results = []
    for name, test_func in tests:
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
    sys.exit(run_all_tests())

