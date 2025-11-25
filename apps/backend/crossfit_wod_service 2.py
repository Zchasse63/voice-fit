"""
CrossFit WOD Modification Service

Adapts CrossFit workouts for:
- Injuries and mobility limitations
- Equipment availability
- Skill level
- Time constraints
"""

import os
import re
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class CrossFitWODService:
    """AI-powered CrossFit WOD modification and scaling"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def parse_wod(self, wod_text: str) -> Dict[str, Any]:
        """
        Parse WOD text to extract structure and movements.
        
        Args:
            wod_text: Raw WOD text
        
        Returns:
            Parsed WOD structure
        """
        try:
            prompt = f"""Parse this CrossFit WOD and extract the structure:

WOD:
{wod_text}

Return JSON with:
- title: WOD name
- type: AMRAP|EMOM|For Time|Chipper|etc
- duration_minutes: estimated duration
- movements: list of {{name, reps, weight, notes}}
- scaling_options: list of {{level, modifications}}"""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )

            # Parse response
            import json
            try:
                result = json.loads(response.content[0].text)
            except:
                result = {"raw_text": wod_text, "error": "Could not parse WOD"}

            return result
        except Exception as e:
            print(f"Error parsing WOD: {e}")
            return {"error": str(e)}

    def generate_modifications(
        self,
        user_id: str,
        wod_text: str,
    ) -> Dict[str, Any]:
        """
        Generate WOD modifications based on user's injuries and limitations.
        
        Args:
            user_id: User ID
            wod_text: Original WOD text
        
        Returns:
            Modified WOD options
        """
        try:
            # Fetch user injuries and limitations
            injuries = self._get_user_injuries(user_id)
            equipment = self._get_available_equipment(user_id)
            skill_level = self._get_skill_level(user_id)
            
            # Parse WOD
            parsed_wod = self.parse_wod(wod_text)
            
            # Generate modifications
            prompt = f"""Generate CrossFit WOD modifications for this user:

Original WOD:
{wod_text}

User Profile:
- Injuries: {', '.join(inj.get('body_part', '') for inj in injuries) if injuries else 'None'}
- Available Equipment: {', '.join(equipment) if equipment else 'Standard'}
- Skill Level: {skill_level}

Provide 3 scaling options:
1. Beginner/Scaled version
2. Intermediate version
3. Advanced version

For each, list:
- Modified movements (with substitutions for injured areas)
- Rep ranges
- Weight recommendations
- Time estimate
- Notes on modifications"""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            return {
                "success": True,
                "original_wod": wod_text,
                "modifications": response.content[0].text,
                "user_injuries": [inj.get("body_part") for inj in injuries],
                "skill_level": skill_level,
            }
        except Exception as e:
            print(f"Error generating modifications: {e}")
            return {"error": str(e)}

    def suggest_substitutions(
        self,
        movement: str,
        reason: str,
    ) -> Dict[str, Any]:
        """
        Suggest exercise substitutions for a movement.
        
        Args:
            movement: Original movement
            reason: Reason for substitution (injury, equipment, skill)
        
        Returns:
            List of substitution options
        """
        try:
            prompt = f"""Suggest CrossFit exercise substitutions:

Original Movement: {movement}
Reason for Substitution: {reason}

Provide 3 substitution options with:
- Exercise name
- Why it's a good substitute
- Scaling options
- Equipment needed
- Difficulty level"""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )

            return {
                "success": True,
                "original_movement": movement,
                "reason": reason,
                "substitutions": response.content[0].text,
            }
        except Exception as e:
            print(f"Error suggesting substitutions: {e}")
            return {"error": str(e)}

    def _get_user_injuries(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user's active injuries"""
        try:
            result = self.supabase.table("injuries").select("*").eq(
                "user_id", user_id
            ).is_("resolved_at", "null").execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching injuries: {e}")
            return []

    def _get_available_equipment(self, user_id: str) -> List[str]:
        """Fetch user's available equipment"""
        try:
            result = self.supabase.table("user_preferences").select("equipment").eq(
                "user_id", user_id
            ).single().execute()
            
            if result.data and result.data.get("equipment"):
                return result.data["equipment"]
            
            # Default equipment
            return ["barbell", "dumbbells", "kettlebell", "pull-up bar", "rower", "bike"]
        except Exception as e:
            print(f"Error fetching equipment: {e}")
            return []

    def _get_skill_level(self, user_id: str) -> str:
        """Determine user's CrossFit skill level"""
        try:
            # Check user's experience
            result = self.supabase.table("user_profiles").select("crossfit_experience").eq(
                "user_id", user_id
            ).single().execute()
            
            if result.data:
                experience = result.data.get("crossfit_experience", "beginner")
                return experience
            
            return "intermediate"
        except Exception as e:
            print(f"Error determining skill level: {e}")
            return "intermediate"

