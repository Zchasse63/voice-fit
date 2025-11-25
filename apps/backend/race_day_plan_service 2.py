"""
Race Day Plan Generator Service

Generates personalized race day strategies for endurance events:
- Terrain analysis
- Weather forecast integration
- Pacing strategy
- Nutrition/hydration recommendations
- Pre-race preparation
"""

import os
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class RaceDayPlanService:
    """AI-powered race day planning"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def generate_race_plan(
        self,
        user_id: str,
        race_name: str,
        race_type: str,  # marathon, half_marathon, 5k, triathlon, etc.
        distance_km: float,
        elevation_gain_m: int,
        weather_forecast: Optional[Dict[str, Any]] = None,
        user_pr: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Generate personalized race day plan.
        
        Args:
            user_id: User ID
            race_name: Race name
            race_type: Type of race
            distance_km: Race distance in km
            elevation_gain_m: Total elevation gain in meters
            weather_forecast: Weather forecast data
            user_pr: User's personal record for distance
        
        Returns:
            Race day plan
        """
        try:
            # Fetch user training data
            user_data = self._get_user_training_data(user_id)
            
            # Generate plan
            prompt = f"""Generate a race day plan for {race_name}:

Race Details:
- Type: {race_type}
- Distance: {distance_km} km
- Elevation Gain: {elevation_gain_m} m
- Personal Record: {user_pr or 'Unknown'}

User Profile:
- Experience Level: {user_data.get('experience_level', 'intermediate')}
- Recent Training: {user_data.get('recent_training', 'Unknown')}
- Injuries: {', '.join(user_data.get('injuries', [])) or 'None'}

Weather:
- Temperature: {weather_forecast.get('temp', 'Unknown') if weather_forecast else 'Unknown'}°C
- Conditions: {weather_forecast.get('conditions', 'Unknown') if weather_forecast else 'Unknown'}
- Wind: {weather_forecast.get('wind', 'Unknown') if weather_forecast else 'Unknown'} km/h

Provide:
1. Pacing strategy (splits for each segment)
2. Nutrition plan (timing and amounts)
3. Hydration strategy
4. Pre-race preparation (48 hours before)
5. Race morning routine
6. Mental strategy
7. Contingency plans

Format as JSON."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                plan = json.loads(response.content[0].text)
            except:
                plan = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "race_name": race_name,
                "race_type": race_type,
                "distance_km": distance_km,
                "plan": plan,
            }
        except Exception as e:
            print(f"Error generating race plan: {e}")
            return {"error": str(e)}

    def analyze_terrain(
        self,
        race_name: str,
        elevation_profile: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze race terrain and provide strategy.
        
        Args:
            race_name: Race name
            elevation_profile: Elevation profile data
        
        Returns:
            Terrain analysis and strategy
        """
        try:
            prompt = f"""Analyze the terrain for {race_name}:

Elevation Profile: {elevation_profile or 'Not provided'}

Provide:
1. Terrain difficulty assessment
2. Key climbing sections
3. Descent strategy
4. Technical sections
5. Pacing recommendations per section
6. Energy management strategy

Format as JSON."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                analysis = json.loads(response.content[0].text)
            except:
                analysis = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "race_name": race_name,
                "analysis": analysis,
            }
        except Exception as e:
            print(f"Error analyzing terrain: {e}")
            return {"error": str(e)}

    def get_nutrition_strategy(
        self,
        race_type: str,
        distance_km: float,
        weather_temp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Get nutrition and hydration strategy.
        
        Args:
            race_type: Type of race
            distance_km: Race distance
            weather_temp: Temperature forecast
        
        Returns:
            Nutrition strategy
        """
        try:
            prompt = f"""Create nutrition and hydration strategy for {race_type}:

Race Details:
- Distance: {distance_km} km
- Temperature: {weather_temp or 'Unknown'}°C

Provide:
1. Pre-race meal (timing and composition)
2. During-race nutrition (timing and amounts)
3. Hydration schedule
4. Electrolyte strategy
5. Fueling options (gels, bars, drinks)
6. Stomach management tips
7. Post-race recovery nutrition

Format as JSON with specific timing and amounts."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                strategy = json.loads(response.content[0].text)
            except:
                strategy = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "race_type": race_type,
                "distance_km": distance_km,
                "strategy": strategy,
            }
        except Exception as e:
            print(f"Error getting nutrition strategy: {e}")
            return {"error": str(e)}

    def _get_user_training_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch user training data"""
        try:
            # Fetch user profile
            profile_result = self.supabase.table("user_profiles").select("*").eq(
                "user_id", user_id
            ).single().execute()
            
            profile = profile_result.data if profile_result.data else {}
            
            # Fetch recent workouts
            workouts_result = self.supabase.table("runs").select("*").eq(
                "user_id", user_id
            ).order("start_time", desc=True).limit(10).execute()
            
            workouts = workouts_result.data if workouts_result.data else []
            
            # Fetch active injuries
            injuries_result = self.supabase.table("injuries").select("body_part").eq(
                "user_id", user_id
            ).is_("resolved_at", "null").execute()
            
            injuries = [inj.get("body_part") for inj in (injuries_result.data or [])]
            
            return {
                "experience_level": profile.get("experience_level", "intermediate"),
                "recent_training": f"{len(workouts)} workouts in last 10 entries",
                "injuries": injuries,
            }
        except Exception as e:
            print(f"Error fetching user data: {e}")
            return {
                "experience_level": "intermediate",
                "recent_training": "Unknown",
                "injuries": [],
            }

