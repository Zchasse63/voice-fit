"""
Voice-First Enhancements Service

Provides voice-activated features:
- Voice command exercise swaps
- Conversational program modifications
- Voice-activated form cues
- Siri/Google Assistant integration
"""

import os
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class VoiceFirstService:
    """AI-powered voice-first training enhancements"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def process_voice_command(
        self,
        user_id: str,
        command: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process voice command for exercise swap or modification.
        
        Args:
            user_id: User ID
            command: Voice command text
            context: Current workout context
        
        Returns:
            Command interpretation and action
        """
        try:
            prompt = f"""Process this voice command for a workout:

Command: "{command}"

Current Context:
- Workout Type: {context.get('workout_type', 'Unknown') if context else 'Unknown'}
- Current Exercise: {context.get('current_exercise', 'Unknown') if context else 'Unknown'}
- Remaining Sets: {context.get('remaining_sets', 'Unknown') if context else 'Unknown'}

Interpret the command and provide:
1. Command type (swap_exercise, modify_weight, adjust_reps, form_cue, rest_timer, etc.)
2. Specific action to take
3. Confirmation message for user
4. Alternative exercises if applicable

Format as JSON."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                result = json.loads(response.content[0].text)
            except:
                result = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "command": command,
                "interpretation": result,
            }
        except Exception as e:
            print(f"Error processing voice command: {e}")
            return {"error": str(e)}

    def get_form_cue(
        self,
        exercise: str,
        focus_area: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get voice-activated form cue for an exercise.
        
        Args:
            exercise: Exercise name
            focus_area: Specific area to focus on
        
        Returns:
            Form cue with audio-friendly description
        """
        try:
            prompt = f"""Provide a concise, audio-friendly form cue for {exercise}:

{f'Focus on: {focus_area}' if focus_area else ''}

Provide:
1. Key form points (3-5 bullet points)
2. Common mistakes to avoid
3. Breathing cue
4. Audio-friendly description (short, clear, actionable)

Format as JSON with audio_cue as a single sentence."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                cue = json.loads(response.content[0].text)
            except:
                cue = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "exercise": exercise,
                "form_cue": cue,
            }
        except Exception as e:
            print(f"Error getting form cue: {e}")
            return {"error": str(e)}

    def generate_conversational_modification(
        self,
        user_id: str,
        program_id: str,
        modification_request: str,
    ) -> Dict[str, Any]:
        """
        Generate program modification based on conversational request.
        
        Args:
            user_id: User ID
            program_id: Program ID
            modification_request: Natural language modification request
        
        Returns:
            Modified program
        """
        try:
            # Fetch current program
            program_result = self.supabase.table("programs").select("*").eq(
                "id", program_id
            ).single().execute()
            
            program = program_result.data if program_result.data else {}
            
            prompt = f"""Modify this training program based on user request:

Current Program:
- Name: {program.get('name', 'Unknown')}
- Duration: {program.get('duration_weeks', 'Unknown')} weeks
- Focus: {program.get('focus', 'Unknown')}

User Request: "{modification_request}"

Provide:
1. Interpretation of the request
2. Specific modifications to make
3. Affected workouts/exercises
4. Expected impact on results
5. Confirmation message

Format as JSON."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            import json
            try:
                modification = json.loads(response.content[0].text)
            except:
                modification = {"raw_response": response.content[0].text}

            return {
                "success": True,
                "program_id": program_id,
                "modification_request": modification_request,
                "modification": modification,
            }
        except Exception as e:
            print(f"Error generating modification: {e}")
            return {"error": str(e)}

    def get_voice_shortcuts(self) -> Dict[str, Any]:
        """
        Get available voice shortcuts for common commands.
        
        Returns:
            List of voice shortcuts
        """
        shortcuts = {
            "exercise_swaps": [
                {"command": "swap this for [exercise]", "action": "Replace current exercise"},
                {"command": "make it easier", "action": "Reduce weight or reps"},
                {"command": "make it harder", "action": "Increase weight or reps"},
            ],
            "form_cues": [
                {"command": "form check", "action": "Get form cue for current exercise"},
                {"command": "how do I do this", "action": "Get detailed form instructions"},
                {"command": "focus on [body part]", "action": "Get form cue for specific area"},
            ],
            "workout_control": [
                {"command": "start timer", "action": "Start rest timer"},
                {"command": "next set", "action": "Move to next set"},
                {"command": "skip this", "action": "Skip current exercise"},
                {"command": "end workout", "action": "Finish workout"},
            ],
            "program_modifications": [
                {"command": "add more cardio", "action": "Increase cardio volume"},
                {"command": "less volume", "action": "Reduce workout volume"},
                {"command": "focus on [muscle group]", "action": "Adjust program focus"},
            ],
        }
        
        return {
            "success": True,
            "shortcuts": shortcuts,
        }

