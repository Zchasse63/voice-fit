"""
Sport-Specific Training Programs Service

Generates tailored strength training programs for specific sports:
- Basketball, Soccer, Baseball, Football, Tennis, etc.
- Position-specific variations
- Season periodization (off-season, pre-season, in-season)
"""

import os
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class SportSpecificTrainingService:
    """AI-powered sport-specific training program generation"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def generate_program(
        self,
        user_id: str,
        sport: str,
        position: Optional[str] = None,
        season: str = "off-season",
        duration_weeks: int = 12,
    ) -> Dict[str, Any]:
        """
        Generate a sport-specific training program.
        
        Args:
            user_id: User ID
            sport: Sport type (basketball, soccer, baseball, football, tennis, etc.)
            position: Position in sport (optional)
            season: Training season (off-season, pre-season, in-season)
            duration_weeks: Program duration in weeks
        
        Returns:
            Sport-specific training program
        """
        try:
            # Fetch user profile and training history
            user_data = self._get_user_data(user_id)
            
            # Generate program using AI
            prompt = f"""Generate a {duration_weeks}-week {sport} training program:

User Profile:
- Experience Level: {user_data.get('experience_level', 'intermediate')}
- Current Injuries: {', '.join(user_data.get('injuries', [])) or 'None'}
- Available Equipment: {', '.join(user_data.get('equipment', []))}

Program Requirements:
- Sport: {sport}
- Position: {position or 'General'}
- Season: {season}
- Duration: {duration_weeks} weeks

For {season} phase, provide:
1. Weekly structure (e.g., 4 days/week)
2. Focus areas (e.g., power, strength, endurance, agility)
3. Sample exercises for each day
4. Progression scheme
5. Sport-specific drills
6. Recovery recommendations

Format as JSON with:
- weekly_structure: {{day: exercises}}
- focus_areas: [list]
- progression: {{week: intensity}}
- sport_drills: [list]
- recovery_protocol: {{type: description}}"""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                program = json.loads(response.content[0].text)
            except:
                program = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "sport": sport,
                "position": position,
                "season": season,
                "duration_weeks": duration_weeks,
                "program": program,
            }
        except Exception as e:
            print(f"Error generating program: {e}")
            return {"error": str(e)}

    def get_position_variations(
        self,
        sport: str,
    ) -> Dict[str, Any]:
        """
        Get position-specific variations for a sport.
        
        Args:
            sport: Sport type
        
        Returns:
            Position variations with focus areas
        """
        try:
            prompt = f"""List position-specific training focuses for {sport}:

For each position, provide:
- Position name
- Key physical attributes (strength, speed, endurance, agility)
- Primary muscle groups
- Sport-specific movements
- Injury prevention focus

Format as JSON with positions as keys."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                variations = json.loads(response.content[0].text)
            except:
                variations = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "sport": sport,
                "variations": variations,
            }
        except Exception as e:
            print(f"Error getting position variations: {e}")
            return {"error": str(e)}

    def get_season_periodization(
        self,
        sport: str,
        duration_weeks: int = 52,
    ) -> Dict[str, Any]:
        """
        Get season periodization plan for a sport.
        
        Args:
            sport: Sport type
            duration_weeks: Total weeks in season
        
        Returns:
            Periodization plan with phases
        """
        try:
            prompt = f"""Create a {duration_weeks}-week periodization plan for {sport}:

Provide phases:
1. Off-season (building strength, power, endurance)
2. Pre-season (sport-specific conditioning)
3. In-season (maintenance, injury prevention)
4. Post-season (recovery, deload)

For each phase, specify:
- Duration (weeks)
- Training focus
- Volume and intensity
- Frequency
- Recovery emphasis

Format as JSON with phases as keys."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                periodization = json.loads(response.content[0].text)
            except:
                periodization = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "sport": sport,
                "duration_weeks": duration_weeks,
                "periodization": periodization,
            }
        except Exception as e:
            print(f"Error getting periodization: {e}")
            return {"error": str(e)}

    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch user profile and training data"""
        try:
            # Fetch user profile
            profile_result = self.supabase.table("user_profiles").select("*").eq(
                "user_id", user_id
            ).single().execute()
            
            profile = profile_result.data if profile_result.data else {}
            
            # Fetch active injuries
            injuries_result = self.supabase.table("injuries").select("body_part").eq(
                "user_id", user_id
            ).is_("resolved_at", "null").execute()
            
            injuries = [inj.get("body_part") for inj in (injuries_result.data or [])]
            
            # Fetch preferences
            prefs_result = self.supabase.table("user_preferences").select("*").eq(
                "user_id", user_id
            ).single().execute()
            
            prefs = prefs_result.data if prefs_result.data else {}
            
            return {
                "experience_level": profile.get("experience_level", "intermediate"),
                "injuries": injuries,
                "equipment": prefs.get("equipment", []),
            }
        except Exception as e:
            print(f"Error fetching user data: {e}")
            return {
                "experience_level": "intermediate",
                "injuries": [],
                "equipment": [],
            }

