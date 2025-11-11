"""
Weather Service for VoiceFit

Fetches historical weather data for running workouts using OpenWeatherMap API.
Provides temperature, humidity, wind speed, and weather conditions for run analysis.
"""

import os
import requests
from typing import Dict, Any, Optional
from datetime import datetime
import time


class WeatherService:
    """
    Service to fetch weather data for running workouts.
    
    Uses OpenWeatherMap API to get historical weather data for a specific
    location and time. This data is used to:
    - Analyze performance impact of weather conditions
    - Award weather-specific badges (Rain Runner, Cold Warrior, Heat Champion)
    - Provide context-aware running insights
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize WeatherService.
        
        Args:
            api_key: OpenWeatherMap API key. If None, reads from WEATHER_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("WEATHER_API_KEY")
        self.provider = os.getenv("WEATHER_API_PROVIDER", "openweathermap")
        
        if not self.api_key:
            raise ValueError("Weather API key not found. Set WEATHER_API_KEY environment variable.")
        
        # OpenWeatherMap API endpoints
        self.current_weather_url = "https://api.openweathermap.org/data/2.5/weather"
        self.historical_weather_url = "https://api.openweathermap.org/data/3.0/onecall/timemachine"
    
    def get_weather_for_run(
        self,
        latitude: float,
        longitude: float,
        timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get weather data for a run at a specific location and time.
        
        Args:
            latitude: Latitude of run location
            longitude: Longitude of run location
            timestamp: Time of run. If None, uses current time.
        
        Returns:
            Dict with weather data:
            {
                "temperature_f": 72.5,
                "temperature_c": 22.5,
                "humidity": 65,
                "wind_speed_mph": 8.5,
                "wind_speed_kph": 13.7,
                "wind_direction": 180,
                "conditions": "Clear",
                "description": "clear sky",
                "dew_point_f": 58.3,
                "dew_point_c": 14.6,
                "feels_like_f": 70.2,
                "feels_like_c": 21.2,
                "pressure": 1013,
                "visibility": 10000,
                "clouds": 0,
                "timestamp": "2024-01-15T10:30:00Z"
            }
        """
        if timestamp is None:
            # Current weather
            return self._get_current_weather(latitude, longitude)
        else:
            # Historical weather (for past runs)
            return self._get_historical_weather(latitude, longitude, timestamp)
    
    def _get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get current weather data.
        
        Uses OpenWeatherMap Current Weather API (free tier).
        """
        try:
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": self.api_key,
                "units": "metric"  # Get Celsius, we'll convert to Fahrenheit
            }
            
            response = requests.get(self.current_weather_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract and format weather data
            return self._format_weather_data(data)
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching current weather: {e}")
            return self._get_fallback_weather()
    
    def _get_historical_weather(
        self,
        latitude: float,
        longitude: float,
        timestamp: datetime
    ) -> Dict[str, Any]:
        """
        Get historical weather data.
        
        Note: OpenWeatherMap historical data requires a paid subscription.
        For free tier, we'll use current weather as fallback.
        
        TODO: Consider using alternative free historical weather APIs:
        - Visual Crossing Weather API (free tier: 1000 calls/day)
        - Weatherstack (free tier: 1000 calls/month)
        """
        # Check if timestamp is recent (within last hour)
        time_diff = datetime.utcnow() - timestamp.replace(tzinfo=None)
        
        if time_diff.total_seconds() < 3600:  # Less than 1 hour ago
            # Use current weather as approximation
            print(f"Using current weather for recent run (timestamp: {timestamp})")
            return self._get_current_weather(latitude, longitude)
        else:
            # For older runs, we need historical API (paid)
            # For now, return fallback data
            print(f"Historical weather not available for {timestamp}. Using fallback.")
            return self._get_fallback_weather()
    
    def _format_weather_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format OpenWeatherMap API response into our standard format.
        
        Args:
            data: Raw API response from OpenWeatherMap
        
        Returns:
            Formatted weather data dict
        """
        # Extract main weather data
        main = data.get("main", {})
        wind = data.get("wind", {})
        weather = data.get("weather", [{}])[0]
        clouds = data.get("clouds", {})
        
        # Temperature conversions (API returns Celsius)
        temp_c = main.get("temp", 20)
        temp_f = self._celsius_to_fahrenheit(temp_c)
        
        feels_like_c = main.get("feels_like", temp_c)
        feels_like_f = self._celsius_to_fahrenheit(feels_like_c)
        
        dew_point_c = main.get("dew_point", temp_c - 5)  # Estimate if not provided
        dew_point_f = self._celsius_to_fahrenheit(dew_point_c)
        
        # Wind speed conversions (API returns m/s)
        wind_speed_ms = wind.get("speed", 0)
        wind_speed_kph = wind_speed_ms * 3.6
        wind_speed_mph = wind_speed_ms * 2.237
        
        return {
            "temperature_f": round(temp_f, 1),
            "temperature_c": round(temp_c, 1),
            "humidity": main.get("humidity", 50),
            "wind_speed_mph": round(wind_speed_mph, 1),
            "wind_speed_kph": round(wind_speed_kph, 1),
            "wind_direction": wind.get("deg", 0),
            "conditions": weather.get("main", "Clear"),
            "description": weather.get("description", "clear sky"),
            "dew_point_f": round(dew_point_f, 1),
            "dew_point_c": round(dew_point_c, 1),
            "feels_like_f": round(feels_like_f, 1),
            "feels_like_c": round(feels_like_c, 1),
            "pressure": main.get("pressure", 1013),
            "visibility": data.get("visibility", 10000),
            "clouds": clouds.get("all", 0),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    def _celsius_to_fahrenheit(self, celsius: float) -> float:
        """Convert Celsius to Fahrenheit."""
        return (celsius * 9/5) + 32
    
    def _get_fallback_weather(self) -> Dict[str, Any]:
        """
        Return fallback weather data when API is unavailable.
        
        Uses neutral conditions (65°F, 50% humidity, no wind).
        """
        return {
            "temperature_f": 65.0,
            "temperature_c": 18.3,
            "humidity": 50,
            "wind_speed_mph": 0.0,
            "wind_speed_kph": 0.0,
            "wind_direction": 0,
            "conditions": "Clear",
            "description": "clear sky",
            "dew_point_f": 45.0,
            "dew_point_c": 7.2,
            "feels_like_f": 65.0,
            "feels_like_c": 18.3,
            "pressure": 1013,
            "visibility": 10000,
            "clouds": 0,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    def analyze_weather_impact(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the impact of weather conditions on running performance.
        
        Based on research:
        - Pace slows 0.4% per °F above 60°F
        - Pace slows 0.2% per % humidity above 60%
        - Dew point model: Adjusted Pace = Base Pace + [(Dew Point°F - 60) × 0.025]
        
        Args:
            weather_data: Weather data dict from get_weather_for_run()
        
        Returns:
            Dict with impact analysis:
            {
                "temperature_impact": "moderate",  # none, mild, moderate, severe
                "humidity_impact": "mild",
                "wind_impact": "none",
                "overall_difficulty": "moderate",
                "estimated_pace_slowdown_percent": 3.5,
                "recommendations": ["Consider hydration", "Expect slower pace"]
            }
        """
        temp_f = weather_data.get("temperature_f", 65)
        humidity = weather_data.get("humidity", 50)
        dew_point_f = weather_data.get("dew_point_f", 50)
        wind_speed_mph = weather_data.get("wind_speed_mph", 0)
        
        # Temperature impact
        temp_impact = "none"
        temp_slowdown = 0
        if temp_f > 60:
            temp_slowdown = (temp_f - 60) * 0.4
            if temp_f > 85:
                temp_impact = "severe"
            elif temp_f > 75:
                temp_impact = "moderate"
            else:
                temp_impact = "mild"
        elif temp_f < 32:
            temp_impact = "moderate"  # Cold also impacts performance
            temp_slowdown = 2.0
        
        # Humidity impact
        humidity_impact = "none"
        humidity_slowdown = 0
        if humidity > 60:
            humidity_slowdown = (humidity - 60) * 0.2
            if humidity > 85:
                humidity_impact = "severe"
            elif humidity > 75:
                humidity_impact = "moderate"
            else:
                humidity_impact = "mild"
        
        # Wind impact (simplified)
        wind_impact = "none"
        wind_slowdown = 0
        if wind_speed_mph > 15:
            wind_impact = "moderate"
            wind_slowdown = 2.0
        elif wind_speed_mph > 10:
            wind_impact = "mild"
            wind_slowdown = 1.0
        
        # Total estimated slowdown
        total_slowdown = temp_slowdown + humidity_slowdown + wind_slowdown
        
        # Overall difficulty
        if total_slowdown > 8:
            overall_difficulty = "severe"
        elif total_slowdown > 4:
            overall_difficulty = "moderate"
        elif total_slowdown > 1:
            overall_difficulty = "mild"
        else:
            overall_difficulty = "ideal"
        
        # Recommendations
        recommendations = []
        if temp_f > 80:
            recommendations.append("Stay well hydrated - hot conditions")
        if temp_f < 32:
            recommendations.append("Dress in layers - cold conditions")
        if humidity > 75:
            recommendations.append("High humidity - expect reduced cooling efficiency")
        if wind_speed_mph > 15:
            recommendations.append("Strong winds - pace may vary by direction")
        if dew_point_f > 65:
            recommendations.append("High dew point - uncomfortable conditions")
        
        return {
            "temperature_impact": temp_impact,
            "humidity_impact": humidity_impact,
            "wind_impact": wind_impact,
            "overall_difficulty": overall_difficulty,
            "estimated_pace_slowdown_percent": round(total_slowdown, 1),
            "recommendations": recommendations
        }

