"""
Hybrid Athlete Training Service

Balances strength training with endurance training without interference.
Optimizes concurrent training for:
- Marathon runners adding strength
- Powerlifters adding cardio
- CrossFit athletes balancing both
- General fitness enthusiasts
"""

import os
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class HybridAthleteService:
    """AI-powered hybrid athlete training optimization"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def generate_hybrid_program(
        self,
        user_id: str,
        primary_goal: str,  # "strength" or "endurance"
        secondary_goal: str,  # "endurance" or "strength"
        duration_weeks: int = 12,
    ) -> Dict[str, Any]:
        """
        Generate a hybrid training program balancing strength and endurance.
        
        Args:
            user_id: User ID
            primary_goal: Primary training goal (strength or endurance)
            secondary_goal: Secondary training goal (endurance or strength)
            duration_weeks: Program duration in weeks
        
        Returns:
            Hybrid training program
        """
        try:
            # Fetch user data
            user_data = self._get_user_data(user_id)
            
            # Generate program
            prompt = f"""Generate a {duration_weeks}-week hybrid athlete program:

User Profile:
- Experience Level: {user_data.get('experience_level', 'intermediate')}
- Current Injuries: {', '.join(user_data.get('injuries', [])) or 'None'}
- Available Equipment: {', '.join(user_data.get('equipment', []))}

Program Requirements:
- Primary Goal: {primary_goal}
- Secondary Goal: {secondary_goal}
- Duration: {duration_weeks} weeks

Provide:
1. Weekly structure (balance strength and endurance)
2. Interference mitigation strategies
3. Recovery protocols
4. Nutrition recommendations
5. Periodization phases
6. Key metrics to track

Format as JSON with:
- weekly_structure: {{day: {{type: strength|endurance, focus: description}}}}
- interference_mitigation: [strategies]
- recovery_protocol: {{daily: description}}
- nutrition: {{macros: targets}}
- periodization: {{phase: details}}"""

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
                "primary_goal": primary_goal,
                "secondary_goal": secondary_goal,
                "duration_weeks": duration_weeks,
                "program": program,
            }
        except Exception as e:
            print(f"Error generating hybrid program: {e}")
            return {"error": str(e)}

    def get_interference_mitigation(
        self,
        primary_goal: str,
        secondary_goal: str,
    ) -> Dict[str, Any]:
        """
        Get strategies to minimize training interference.
        
        Args:
            primary_goal: Primary training goal
            secondary_goal: Secondary training goal
        
        Returns:
            Interference mitigation strategies
        """
        try:
            prompt = f"""Provide strategies to minimize training interference between {primary_goal} and {secondary_goal}:

For each strategy, provide:
- Strategy name
- How it works
- When to apply
- Expected benefits
- Potential risks

Focus on:
1. Workout sequencing
2. Recovery optimization
3. Nutrition timing
4. Volume management
5. Intensity distribution

Format as JSON."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                strategies = json.loads(response.content[0].text)
            except:
                strategies = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "primary_goal": primary_goal,
                "secondary_goal": secondary_goal,
                "strategies": strategies,
            }
        except Exception as e:
            print(f"Error getting interference mitigation: {e}")
            return {"error": str(e)}

    def get_recovery_protocol(
        self,
        primary_goal: str,
        secondary_goal: str,
    ) -> Dict[str, Any]:
        """
        Get recovery protocol for hybrid training.
        
        Args:
            primary_goal: Primary training goal
            secondary_goal: Secondary training goal
        
        Returns:
            Recovery protocol
        """
        try:
            prompt = f"""Create a recovery protocol for hybrid {primary_goal}/{secondary_goal} training:

Provide:
1. Daily recovery routine
2. Weekly recovery emphasis
3. Sleep recommendations
4. Nutrition timing
5. Active recovery days
6. Deload week structure
7. Monitoring metrics

Format as JSON with daily, weekly, and monthly protocols."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                protocol = json.loads(response.content[0].text)
            except:
                protocol = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "primary_goal": primary_goal,
                "secondary_goal": secondary_goal,
                "protocol": protocol,
            }
        except Exception as e:
            print(f"Error getting recovery protocol: {e}")
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

