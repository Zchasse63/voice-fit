"""
Test Weather Service

Tests OpenWeatherMap API integration and weather impact analysis.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from test_config import TEST_LOCATION_SF, TEST_LOCATION_DENVER

# Load environment variables
load_dotenv()

# Import weather service
from weather_service import WeatherService

def test_weather_api_connection():
    """Test OpenWeatherMap API connection"""
    print("\n" + "="*80)
    print("TEST 1: Weather API Connection")
    print("="*80)
    
    try:
        weather_service = WeatherService()
        print("✅ WeatherService initialized successfully")
        print(f"   Provider: {weather_service.provider}")
        print(f"   API Key: {weather_service.api_key[:10]}...")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize WeatherService: {e}")
        return False


def test_current_weather():
    """Test current weather fetching"""
    print("\n" + "="*80)
    print("TEST 2: Current Weather Fetching")
    print("="*80)
    
    try:
        weather_service = WeatherService()
        
        # Test location: San Francisco
        lat, lon = TEST_LOCATION_SF["lat"], TEST_LOCATION_SF["lon"]

        print(f"\n📍 Fetching current weather for {TEST_LOCATION_SF['name']} ({lat}, {lon})...")
        weather = weather_service.get_weather_for_run(lat, lon)
        
        print("\n✅ Current Weather Data:")
        print(f"   Temperature: {weather['temperature_f']}°F ({weather['temperature_c']}°C)")
        print(f"   Feels Like: {weather['feels_like_f']}°F")
        print(f"   Humidity: {weather['humidity']}%")
        print(f"   Wind Speed: {weather['wind_speed_mph']} mph")
        print(f"   Conditions: {weather['conditions']} - {weather['description']}")
        print(f"   Timestamp: {weather['timestamp']}")

        # Validate data
        assert 'temperature_f' in weather
        assert 'temperature_c' in weather
        assert 'humidity' in weather
        assert 'wind_speed_mph' in weather
        assert 'conditions' in weather
        assert isinstance(weather['temperature_f'], (int, float))
        assert isinstance(weather['humidity'], (int, float))
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_historical_weather():
    """Test historical weather fetching"""
    print("\n" + "="*80)
    print("TEST 3: Historical Weather Fetching")
    print("="*80)
    
    try:
        weather_service = WeatherService()
        
        # Test location: New York
        lat, lon = 40.7128, -74.0060
        
        # Test timestamp: 24 hours ago
        timestamp = datetime.now() - timedelta(hours=24)
        
        print(f"\n📍 Fetching historical weather for New York ({lat}, {lon})")
        print(f"   Timestamp: {timestamp}")
        
        weather = weather_service.get_weather_for_run(lat, lon, timestamp)
        
        print("\n✅ Historical Weather Data:")
        print(f"   Temperature: {weather['temperature_f']}°F ({weather['temperature_c']}°C)")
        print(f"   Humidity: {weather['humidity']}%")
        print(f"   Wind Speed: {weather['wind_speed_mph']} mph")
        print(f"   Conditions: {weather['conditions']}")

        # Validate data
        assert 'temperature_f' in weather
        assert 'humidity' in weather
        assert 'wind_speed_mph' in weather
        assert 'conditions' in weather
        
        print("\n✅ All validations passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_weather_impact_analysis():
    """Test weather impact analysis"""
    print("\n" + "="*80)
    print("TEST 4: Weather Impact Analysis")
    print("="*80)
    
    try:
        weather_service = WeatherService()
        
        # Test scenarios
        scenarios = [
            {
                "name": "Hot & Humid",
                "weather": {
                    "temperature_f": 85,
                    "temperature_c": 29.4,
                    "humidity": 80,
                    "wind_speed_mph": 5,
                    "dew_point_f": 75,
                    "conditions": "Clear"
                }
            },
            {
                "name": "Cold & Windy",
                "weather": {
                    "temperature_f": 35,
                    "temperature_c": 1.7,
                    "humidity": 40,
                    "wind_speed_mph": 20,
                    "dew_point_f": 15,
                    "conditions": "Cloudy"
                }
            },
            {
                "name": "Ideal Conditions",
                "weather": {
                    "temperature_f": 60,
                    "temperature_c": 15.6,
                    "humidity": 50,
                    "wind_speed_mph": 5,
                    "dew_point_f": 40,
                    "conditions": "Clear"
                }
            },
            {
                "name": "Rainy",
                "weather": {
                    "temperature_f": 55,
                    "temperature_c": 12.8,
                    "humidity": 90,
                    "wind_speed_mph": 10,
                    "dew_point_f": 52,
                    "conditions": "Rain"
                }
            }
        ]
        
        for scenario in scenarios:
            print(f"\n📊 Scenario: {scenario['name']}")
            print(f"   Temperature: {scenario['weather']['temperature_f']}°F")
            print(f"   Humidity: {scenario['weather']['humidity']}%")
            print(f"   Wind: {scenario['weather']['wind_speed_mph']} mph")
            print(f"   Conditions: {scenario['weather']['conditions']}")

            impact = weather_service.analyze_weather_impact(scenario['weather'])

            print(f"\n   Impact Analysis:")
            print(f"   - Temperature Impact: {impact['temperature_impact']}")
            print(f"   - Humidity Impact: {impact['humidity_impact']}")
            print(f"   - Wind Impact: {impact['wind_impact']}")
            print(f"   - Estimated Pace Slowdown: {impact['estimated_pace_slowdown_percent']:.1f}%")
            print(f"   - Overall Difficulty: {impact['overall_difficulty']}")
            if impact['recommendations']:
                print(f"   - Recommendations:")
                for rec in impact['recommendations']:
                    print(f"     • {rec}")

            # Validate impact
            assert 'temperature_impact' in impact
            assert 'humidity_impact' in impact
            assert 'wind_impact' in impact
            assert 'estimated_pace_slowdown_percent' in impact
            assert 'overall_difficulty' in impact
            assert impact['overall_difficulty'] in ['ideal', 'mild', 'moderate', 'severe']
            assert impact['temperature_impact'] in ['none', 'mild', 'moderate', 'severe']
        
        print("\n✅ All scenarios tested successfully")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_error_handling():
    """Test error handling"""
    print("\n" + "="*80)
    print("TEST 5: Error Handling")
    print("="*80)

    try:
        weather_service = WeatherService()

        # Test invalid coordinates - should return fallback data, not raise error
        print("\n🧪 Testing invalid coordinates...")
        weather = weather_service.get_weather_for_run(999, 999)

        # Should get fallback weather data
        assert weather is not None
        assert 'temperature_f' in weather
        assert weather['temperature_f'] == 65.0  # Fallback default
        print("✅ Correctly returned fallback data for invalid coordinates")

        # Test future timestamp (should fall back to current)
        print("\n🧪 Testing future timestamp...")
        future_time = datetime.now() + timedelta(days=1)
        weather = weather_service.get_weather_for_run(37.7749, -122.4194, future_time)
        assert weather is not None
        assert 'temperature_f' in weather
        print("✅ Handled future timestamp (fell back to current weather)")

        print("\n✅ Error handling tests passed")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all weather service tests"""
    print("\n" + "="*80)
    print("WEATHER SERVICE TEST SUITE")
    print("="*80)
    
    tests = [
        ("Weather API Connection", test_weather_api_connection),
        ("Current Weather Fetching", test_current_weather),
        ("Historical Weather Fetching", test_historical_weather),
        ("Weather Impact Analysis", test_weather_impact_analysis),
        ("Error Handling", test_error_handling),
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

