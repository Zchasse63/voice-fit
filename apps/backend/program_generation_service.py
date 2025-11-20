"""
Program Generation Service with RAG (Retrieval-Augmented Generation)

This service handles AI program generation using:
1. Smart Namespace Selector with optimized Upstash Search
2. Grok 4 Fast Reasoning for high-quality program generation
3. Evidence-based programming principles from knowledge base

Optimizations:
- Smart namespace selection based on questionnaire
- Hybrid search tuning (60-90% semantic weight)
- Post-filtering by content_type
- Input enrichment disabled for faster queries
- Grok 4 Fast: 3x cheaper than GPT-4.1, better reasoning
"""

import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from openai import OpenAI

from smart_namespace_selector import SmartNamespaceSelector

load_dotenv()


class ProgramGenerationService:
    """Service for generating AI-powered custom training programs"""

    def __init__(self, warmup_cooldown_service=None):
        """Initialize the program generation service"""
        # Initialize Smart Namespace Selector (handles Upstash internally)
        self.selector = SmartNamespaceSelector()

        # xAI (Grok) credentials for program generation
        self.xai_api_key = os.getenv("XAI_API_KEY")
        if not self.xai_api_key:
            raise ValueError("Missing xAI API key")

        # Initialize Grok client (uses OpenAI-compatible API)
        self.grok_client = OpenAI(
            api_key=self.xai_api_key, base_url="https://api.x.ai/v1"
        )

        # Model configuration
        self.model_name = "grok-4-fast-reasoning"

        # RAG configuration
        self.max_chunks = 50  # Maximum knowledge chunks to retrieve

        # Warmup/Cooldown service (optional)
        self.warmup_cooldown_service = warmup_cooldown_service

    def generate_program(
        self,
        questionnaire: Dict[str, Any],
        user_context: Optional[str] = None,
        rag_context: Optional[str] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a complete 12-week training program using Grok 4 Fast

        Args:
            questionnaire: User's training questionnaire data
            user_context: User's training history, PRs, injuries, etc. from UserContextBuilder
            rag_context: Pre-retrieved RAG context from RAGIntegrationService (optional)
            user_preferences: User preferences from PersonalizationService (optional)

        Returns:
            Dict containing:
            - program: Complete 12-week program JSON
            - cost: Generation cost breakdown
            - stats: RAG retrieval statistics
            - generation_time: Time taken to generate
        """
        start_time = time.time()

        # Step 1: Use provided RAG context or retrieve knowledge using Smart Namespace Selector
        if rag_context:
            # RAG context already provided - use it directly
            retrieval_time = 0
            namespace_config = {}
            stats = {
                "namespaces_selected": 0,
                "context_length": len(rag_context),
                "estimated_tokens": len(rag_context) // 4,
                "retrieval_time_seconds": 0,
                "source": "rag_integration_service",
            }
        else:
            # Retrieve knowledge using Smart Namespace Selector
            retrieval_start = time.time()
            rag_context = self.selector.get_rag_context(
                questionnaire, max_chunks=self.max_chunks
            )
            retrieval_time = time.time() - retrieval_start

            # Get retrieval stats
            namespace_config = self.selector.select_namespaces(questionnaire)
            stats = {
                "namespaces_selected": len(namespace_config),
                "context_length": len(rag_context),
                "estimated_tokens": len(rag_context) // 4,
                "retrieval_time_seconds": retrieval_time,
                "source": "smart_namespace_selector",
            }

        # Step 2: Build prompt with user context and preferences
        prompt = self._build_program_prompt(questionnaire, rag_context, user_context, user_preferences)

        # Step 3: Call Grok 4 Fast
        generation_start = time.time()
        response = self.grok_client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": self._get_system_message()},
                {"role": "user", "content": prompt},
            ],
            max_tokens=30000,  # Increased for complete 12-week programs
            temperature=0.7,
        )
        generation_time = time.time() - generation_start

        # Step 4: Parse and validate response
        program_json = response.choices[0].message.content

        # Remove markdown code blocks if present
        if "```json" in program_json:
            program_json = program_json.split("```json")[1].split("```")[0].strip()
        elif "```" in program_json:
            program_json = program_json.split("```")[1].split("```")[0].strip()

        try:
            program = json.loads(program_json)
        except json.JSONDecodeError as e:
            # Save raw response for debugging
            with open("grok_error_response.txt", "w") as f:
                f.write(program_json)
            raise ValueError(
                f"Failed to parse JSON response: {e}. Raw response saved to grok_error_response.txt"
            )

        # Step 5: Add warmup/cooldown to each workout if service is available
        if self.warmup_cooldown_service:
            user_id = questionnaire.get("user_id")
            sport_type = questionnaire.get("sport_type", "strength")
            if user_id:
                program = self._add_warmup_cooldown_to_program(program, user_id, sport_type)

        # Calculate metrics
        total_time = time.time() - start_time
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        # Grok 4 Fast pricing: $0.20/M input, $0.50/M output
        input_cost = (input_tokens / 1_000_000) * 0.20
        output_cost = (output_tokens / 1_000_000) * 0.50
        total_cost = input_cost + output_cost

        return {
            "program": program,
            "cost": {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "input_cost": input_cost,
                "output_cost": output_cost,
                "total_cost": total_cost,
            },
            "stats": stats,
            "generation_time_seconds": total_time,
            "retrieval_time_seconds": retrieval_time,
            "model_generation_time_seconds": generation_time,
        }

    def _get_system_message(self) -> str:
        """Get the system message for Grok 4 Fast"""
        return """You are VoiceFit's expert strength training program generator.

You have access to a comprehensive knowledge base of training principles, exercise techniques,
programming strategies, and recovery protocols from world-class coaches and researchers.

Your task is to generate a complete, detailed 12-week training program based on the user's
questionnaire and the provided knowledge base context.

CRITICAL REQUIREMENTS:
1. Generate a COMPLETE 12-week program (all 12 weeks, all sessions)
2. Use JSON format with proper structure
3. Include exercise selection, sets, reps, RPE, rest periods
4. Incorporate periodization and progression
5. Account for injuries and weak points
6. Base recommendations on the knowledge base context provided

Return ONLY valid JSON - no markdown, no explanations outside the JSON.

Your programs are known for:
- Intelligent exercise selection and variation
- Strategic periodization with distinct training phases
- Customization based on individual needs and goals
- Evidence-based progression models (not just linear weight increases)
- Attention to detail in programming variables (intensity, volume, frequency, exercise order)"""

    def _build_program_prompt(
        self,
        questionnaire: Dict[str, Any],
        knowledge_context: str,
        user_context: Optional[str] = None,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build the complete program generation prompt with user context and preferences"""
        # Build prompt
        prompt = f"""Generate a complete 12-week training program for this athlete:

QUESTIONNAIRE:
{json.dumps(questionnaire, indent=2)}
"""

        # Inject user context if available
        if user_context:
            prompt += f"\nUSER CONTEXT:\n{user_context}\n"

        # Inject user preferences if available
        if user_preferences:
            prompt += "\nUSER PREFERENCES:\n"

            # Equipment constraints
            available_equipment = user_preferences.get("available_equipment", [])
            if available_equipment:
                prompt += f"- Available Equipment: {', '.join(available_equipment)}\n"

            # Exercise preferences
            favorite_exercises = user_preferences.get("favorite_exercises", [])
            if favorite_exercises:
                prompt += f"- Favorite Exercises: {', '.join(favorite_exercises)} (prioritize these)\n"

            disliked_exercises = user_preferences.get("disliked_exercises", [])
            if disliked_exercises:
                prompt += f"- Disliked Exercises: {', '.join(disliked_exercises)} (AVOID these)\n"

            exercise_restrictions = user_preferences.get("exercise_restrictions", {})
            if exercise_restrictions:
                prompt += "- Exercise Restrictions:\n"
                for exercise, reason in exercise_restrictions.items():
                    prompt += f"  * {exercise}: {reason}\n"

            # Workout preferences
            preferred_duration = user_preferences.get("preferred_workout_duration_min")
            if preferred_duration:
                prompt += f"- Preferred Workout Duration: {preferred_duration} minutes\n"

            max_workouts_per_week = user_preferences.get("max_workouts_per_week")
            if max_workouts_per_week:
                prompt += f"- Max Workouts Per Week: {max_workouts_per_week}\n"

            preferred_workout_days = user_preferences.get("preferred_workout_days", [])
            if preferred_workout_days:
                day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                days = [day_names[d-1] for d in preferred_workout_days if 1 <= d <= 7]
                prompt += f"- Preferred Training Days: {', '.join(days)}\n"

            # Training style preferences
            preferred_rep_ranges = user_preferences.get("preferred_rep_ranges", {})
            if preferred_rep_ranges:
                prompt += "- Preferred Rep Ranges:\n"
                for style, range_vals in preferred_rep_ranges.items():
                    if isinstance(range_vals, list) and len(range_vals) == 2:
                        prompt += f"  * {style.capitalize()}: {range_vals[0]}-{range_vals[1]} reps\n"

            prefers_supersets = user_preferences.get("prefers_supersets", False)
            if prefers_supersets:
                prompt += "- Prefers Supersets: Yes\n"

            prefers_dropsets = user_preferences.get("prefers_dropsets", False)
            if prefers_dropsets:
                prompt += "- Prefers Dropsets: Yes\n"

            # Recovery preferences
            preferred_deload_frequency = user_preferences.get("preferred_deload_frequency")
            if preferred_deload_frequency:
                prompt += f"- Deload Frequency: Every {preferred_deload_frequency} weeks\n"

            # Communication preferences
            coaching_style = user_preferences.get("coaching_style")
            if coaching_style:
                prompt += f"- Coaching Style: {coaching_style}\n"

            prompt += "\nIMPORTANT: Strictly respect these preferences when generating the program.\n"

        prompt += f"""
KNOWLEDGE BASE CONTEXT:
{knowledge_context}

Generate the complete 12-week program in JSON format with this EXACT structure:

{{
  "program": {{
    "name": "Program Name",
    "description": "Brief description",
    "weeks": [
      {{
        "week": 1,
        "phase": "Phase name (e.g., Hypertrophy, Strength, Peaking)",
        "days": [
          {{
            "day": 1,
            "focus": "Day focus (e.g., Upper Body, Lower Body)",
            "exercises": [
              {{
                "name": "Exercise name",
                "sets": 4,
                "reps": "5" or "8-10",
                "rpe": 7,
                "rest": "3-5 min",
                "notes": "Optional notes"
              }}
            ]
          }}
        ]
      }}
    ]
  }}
}}

CRITICAL: Return ONLY this JSON structure. Include ALL 12 weeks with complete exercise details."""

        return prompt

    def _add_warmup_cooldown_to_program(
        self, program: Dict[str, Any], user_id: str, sport_type: str
    ) -> Dict[str, Any]:
        """
        Add warmup and cooldown routines to each workout in the program

        Args:
            program: Generated program JSON
            user_id: User ID for personalization
            sport_type: Sport type (strength, running, cycling, etc.)

        Returns:
            Program with warmup/cooldown added to each workout
        """
        try:
            weeks = program.get("program", {}).get("weeks", [])

            for week in weeks:
                days = week.get("days", [])

                for day in days:
                    # Determine workout focus from exercises
                    exercises = day.get("exercises", [])
                    if not exercises:
                        continue

                    # Infer focus from exercise names
                    workout_focus = self._infer_workout_focus(exercises)

                    # Generate warmup (10 minutes)
                    warmup = self.warmup_cooldown_service.generate_warmup(
                        user_id=user_id,
                        workout_focus=workout_focus,
                        sport_type=sport_type,
                        duration_min=10
                    )

                    # Generate cooldown (8 minutes)
                    cooldown = self.warmup_cooldown_service.generate_cooldown(
                        user_id=user_id,
                        workout_focus=workout_focus,
                        sport_type=sport_type,
                        duration_min=8
                    )

                    # Add to workout
                    day["warmup"] = warmup
                    day["cooldown"] = cooldown

            return program

        except Exception as e:
            print(f"Error adding warmup/cooldown to program: {e}")
            # Return program without warmup/cooldown if error
            return program

    def _infer_workout_focus(self, exercises: List[Dict[str, Any]]) -> str:
        """
        Infer workout focus from exercise list

        Args:
            exercises: List of exercises

        Returns:
            Workout focus (upper_body, lower_body, full_body, cardio)
        """
        exercise_names = [ex.get("name", "").lower() for ex in exercises]

        # Keywords for different focuses
        upper_keywords = ["bench", "press", "row", "pull", "curl", "tricep", "shoulder", "chest", "back"]
        lower_keywords = ["squat", "deadlift", "lunge", "leg", "calf", "glute", "hamstring", "quad"]
        cardio_keywords = ["run", "bike", "swim", "row", "cardio", "hiit"]

        upper_count = sum(1 for name in exercise_names if any(kw in name for kw in upper_keywords))
        lower_count = sum(1 for name in exercise_names if any(kw in name for kw in lower_keywords))
        cardio_count = sum(1 for name in exercise_names if any(kw in name for kw in cardio_keywords))

        # Determine focus
        if cardio_count > 0:
            return "cardio"
        elif upper_count > lower_count:
            return "upper_body"
        elif lower_count > upper_count:
            return "lower_body"
        else:
            return "full_body"
