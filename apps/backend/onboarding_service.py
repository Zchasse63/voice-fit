"""
OnboardingService - Extract structured data from conversational onboarding

Uses Kimi K2 Thinking to extract structured onboarding data from
natural conversation in the Chat interface.

Extracts:
- Experience level (beginner, intermediate, advanced)
- Training goals (strength, hypertrophy, endurance, etc.)
- Available equipment (barbell, dumbbells, machines, etc.)
- Training frequency (days per week)
- Injury history (current injuries, past injuries)
"""

import os
import re
import json
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from personality_engine import PersonalityEngine

load_dotenv()


def extract_json_from_response(content: str) -> dict:
    """
    Extract JSON from Kimi K2 response, handling markdown code blocks.

    Kimi K2 often wraps JSON in markdown code blocks like:
    ```json
    {"key": "value"}
    ```

    This function handles both plain JSON and markdown-wrapped JSON.
    """
    # Try direct parsing first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Extract from markdown code block (```json ... ```)
        json_match = re.search(r'```json\s*\n(.*?)\n```', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))

        # Try extracting any JSON object
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))

        raise ValueError(f"No valid JSON found in response: {content[:100]}...")

KIMI_API_KEY = os.getenv("KIMI_API_KEY")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.ai/v1")
KIMI_MODEL_ID = os.getenv("KIMI_MODEL_ID", "kimi-k2-thinking")


class OnboardingService:
    """Service for extracting structured onboarding data from conversation"""

    def __init__(self):
        """Initialize onboarding service"""
        self.kimi_api_key = KIMI_API_KEY
        self.kimi_base_url = KIMI_BASE_URL
        self.model_id = KIMI_MODEL_ID
        self.personality_engine = PersonalityEngine()

        if not all([self.kimi_api_key, self.model_id]):
            raise ValueError("Missing required environment variables for Onboarding service")
    
    def extract_onboarding_data(
        self,
        message: str,
        current_step: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Extract structured onboarding data from user message.
        
        Args:
            message: User's message
            current_step: Current onboarding step (welcome, experience_level, training_goals, etc.)
            conversation_history: Previous conversation messages
        
        Returns:
            Dictionary with extracted data:
            {
                "experience_level": "beginner" | "intermediate" | "advanced" | null,
                "training_goals": ["strength", "hypertrophy", ...] | null,
                "available_equipment": ["barbell", "dumbbells", ...] | null,
                "training_frequency": 3-6 | null,
                "injury_history": "description" | null,
                "next_step": "experience_level" | "training_goals" | ... | "complete"
            }
        """
        # Build system prompt for extraction
        system_prompt = self._build_extraction_prompt(current_step)
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history[-5:])  # Last 5 messages for context
        
        # Add current message
        messages.append({"role": "user", "content": message})

        # Call Kimi for extraction
        url = f"{self.kimi_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.kimi_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": 0.3,  # Low temperature for consistent extraction
            "max_tokens": 1500,  # High limit for Kimi K2 reasoning + final JSON answer
            "response_format": {"type": "json_object"}  # Force JSON output
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()
            content = result['choices'][0]['message']['content']

            # Parse JSON response (handles markdown code blocks)
            extracted_data = extract_json_from_response(content)

            return extracted_data

        except Exception as e:
            print(f"Error extracting onboarding data: {e}")
            return {
                "error": str(e),
                "experience_level": None,
                "training_goals": None,
                "available_equipment": None,
                "training_frequency": None,
                "injury_history": None,
                "next_step": current_step
            }
    
    def _build_extraction_prompt(self, current_step: str) -> str:
        """Build system prompt for data extraction based on current step"""
        
        base_prompt = """You are an AI assistant helping extract structured onboarding data from user messages.

Your task is to extract relevant information and return it as JSON.

IMPORTANT: Always return valid JSON with these fields:
- experience_level: "beginner" | "intermediate" | "advanced" | null
- training_goals: array of strings (e.g., ["strength", "hypertrophy", "endurance"]) | null
- available_equipment: array of strings (e.g., ["barbell", "dumbbells", "machines"]) | null
- training_frequency: number (3-6 days per week) | null
- injury_history: string description | null
- next_step: "experience_level" | "training_goals" | "available_equipment" | "training_frequency" | "injury_history" | "complete"

"""
        
        step_prompts = {
            "welcome": """
Current step: WELCOME
Extract any information the user provides in their initial message.
Set next_step to "experience_level" if no experience level detected, otherwise move to next missing field.
""",
            "experience_level": """
Current step: EXPERIENCE LEVEL
Look for indicators of experience:
- Beginner: "new to lifting", "just started", "never lifted before"
- Intermediate: "been lifting for 1-2 years", "know the basics", "comfortable with form"
- Advanced: "lifting for 3+ years", "compete", "advanced lifter"

Set next_step to "training_goals" after extracting experience level.
""",
            "training_goals": """
Current step: TRAINING GOALS
Extract training goals from the message:
- "strength": powerlifting, getting stronger, low reps
- "hypertrophy": muscle growth, bodybuilding, aesthetics
- "endurance": conditioning, stamina, high reps
- "athletic_performance": sports performance, explosiveness
- "general_fitness": overall health, staying active

Set next_step to "available_equipment" after extracting goals.
""",
            "available_equipment": """
Current step: AVAILABLE EQUIPMENT
Extract equipment from the message:
- "barbell": barbell, olympic bar
- "dumbbells": dumbbells, DBs
- "machines": cable machines, leg press, smith machine
- "bodyweight": no equipment, calisthenics
- "kettlebells": kettlebells, KBs
- "resistance_bands": bands, resistance bands
- "full_gym": commercial gym, full gym access

Set next_step to "training_frequency" after extracting equipment.
""",
            "training_frequency": """
Current step: TRAINING FREQUENCY
Extract how many days per week the user can train (3-6 days).
Look for: "3 days", "4x per week", "train 5 times", etc.

Set next_step to "injury_history" after extracting frequency.
""",
            "injury_history": """
Current step: INJURY HISTORY
Extract any current or past injuries mentioned.
If user says "no injuries" or "healthy", set injury_history to "none".

Set next_step to "complete" after extracting injury history.
"""
        }
        
        step_specific = step_prompts.get(current_step, step_prompts["welcome"])
        
        return base_prompt + step_specific + """

Example JSON response:
{
  "experience_level": "intermediate",
  "training_goals": ["strength", "hypertrophy"],
  "available_equipment": ["barbell", "dumbbells", "machines"],
  "training_frequency": 4,
  "injury_history": "Previous shoulder injury, fully recovered",
  "next_step": "complete"
}

Return ONLY valid JSON, no other text.
"""

    def generate_conversational_response(
        self,
        current_step: str,
        user_context: Dict[str, Any],
        previous_answer: Optional[str] = None
    ) -> str:
        """
        Generate a personalized, conversational response for the next onboarding question.

        Args:
            current_step: Current onboarding step
            user_context: User's context (experience_level, goals, injuries, etc.)
            previous_answer: User's previous response (to acknowledge)

        Returns:
            Personalized conversational response
        """
        # Define base questions for each step
        base_questions = {
            "welcome": "Let's get started! How long have you been training?",
            "experience_level": "How long have you been training?",
            "training_goals": "What are your main training goals?",
            "available_equipment": "What equipment do you have access to?",
            "training_frequency": "How many days per week can you train?",
            "injury_history": "Do you have any current or past injuries I should know about?"
        }

        base_question = base_questions.get(current_step, "Tell me more about your training.")

        # Use PersonalityEngine to generate conversational response
        response = self.personality_engine.generate_response(
            base_question=base_question,
            user_context=user_context,
            previous_answer=previous_answer,
            conversation_type="onboarding"
        )

        return response

