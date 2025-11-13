"""
Chat Message Classifier

Classifies user messages in the unified chat interface to determine intent:
- workout_log: User is logging a workout set
- question: User is asking the AI Coach a question
- general: General conversation
- onboarding: User is in onboarding flow

Uses Kimi K2 Thinking model for accurate classification.
"""

import os
import re
import json
import requests
from typing import Dict, Any, List, Optional, Tuple
from dotenv import load_dotenv

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
        pass

    # Extract from markdown code block (```json ... ```)
    json_match = re.search(r'```json\s*\n(.*?)\n```', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try extracting any JSON object
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    # If all else fails, print the full content for debugging
    print(f"DEBUG - Full response content:\n{content}\n")
    raise ValueError(f"No valid JSON found in response")


class ChatClassifier:
    """
    Classifies chat messages to determine user intent.

    Uses Grok 4 Fast Reasoning for classification.
    """

    def __init__(self):
        self.xai_api_key = os.getenv("XAI_API_KEY")
        self.xai_base_url = "https://api.x.ai/v1"
        self.model_id = "grok-4-fast-reasoning"

        if not self.xai_api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
    
    def classify(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[str, float, str, str]:
        """
        Classify a chat message to determine user intent.
        
        Args:
            message: User's chat message
            user_id: User ID for context
            conversation_history: Recent conversation history
        
        Returns:
            Tuple of (message_type, confidence, reasoning, suggested_action)
        """
        
        # Build system message
        system_message = """You are a chat message classifier for VoiceFit, a voice-first fitness app.

Your job is to classify user messages into one of these categories:

1. **workout_log**: User is logging a workout set
   - Examples: "185 for 8", "bench press 225 pounds 5 reps", "same weight for 10"
   - Indicators: Numbers (weight/reps), exercise names, workout-related terms
   
2. **question**: User is asking the AI Coach a question
   - Examples: "How do I improve my bench press?", "What's a good program for beginners?"
   - Indicators: Question words (how, what, why, when), seeking advice/information
   
3. **onboarding**: User is responding to onboarding questions
   - Examples: "I want to build muscle", "I have dumbbells and a barbell", "3-4 times per week"
   - Indicators: Answering questions about goals, equipment, schedule, experience
   
4. **general**: General conversation or unclear intent
   - Examples: "Thanks!", "Sounds good", "Let's do it"
   - Indicators: Acknowledgments, greetings, unclear messages

Respond with a JSON object:
{
  "message_type": "workout_log" | "question" | "onboarding" | "general",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification",
  "suggested_action": "parse_with_llama" | "call_ai_coach" | "continue_onboarding" | "acknowledge"
}

Be conservative with workout_log classification - only classify as workout_log if you're confident the user is logging a set."""

        # Build conversation context
        messages = [{"role": "system", "content": system_message}]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current message
        messages.append({"role": "user", "content": f"Classify this message: \"{message}\""})

        # Call Grok API
        url = f"{self.xai_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.xai_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": 0.3,  # Lower temperature for more consistent classification
            "max_tokens": 200,  # Lower limit for Grok (no reasoning content in response)
            "response_format": {"type": "json_object"}  # Force JSON response
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"]

            # Parse JSON response (handles markdown code blocks)
            classification = extract_json_from_response(content)

            message_type = classification.get("message_type", "general")
            confidence = classification.get("confidence", 0.5)
            reasoning = classification.get("reasoning", "")
            suggested_action = classification.get("suggested_action", "acknowledge")

            return message_type, confidence, reasoning, suggested_action

        except Exception as e:
            print(f"Error classifying message: {e}")
            # Fallback: Simple rule-based classification
            return self._fallback_classify(message)

    def _fallback_classify(self, message: str) -> Tuple[str, float, str, str]:
        """
        Fallback rule-based classification if Kimi API fails.
        
        Args:
            message: User's chat message
        
        Returns:
            Tuple of (message_type, confidence, reasoning, suggested_action)
        """
        message_lower = message.lower()
        
        # Check for workout logging patterns
        workout_keywords = ["reps", "pounds", "lbs", "kg", "kilos", "for", "x", "sets"]
        has_numbers = any(char.isdigit() for char in message)
        has_workout_keyword = any(keyword in message_lower for keyword in workout_keywords)
        
        if has_numbers and has_workout_keyword:
            return "workout_log", 0.7, "Contains numbers and workout keywords", "parse_with_llama"
        
        # Check for questions
        question_words = ["how", "what", "why", "when", "where", "should", "can", "is", "are", "?"]
        if any(word in message_lower for word in question_words):
            return "question", 0.6, "Contains question words", "call_ai_coach"
        
        # Check for onboarding responses
        onboarding_keywords = ["goal", "muscle", "strength", "lose weight", "equipment", "dumbbells", "barbell", "times per week"]
        if any(keyword in message_lower for keyword in onboarding_keywords):
            return "onboarding", 0.6, "Contains onboarding-related keywords", "continue_onboarding"
        
        # Default to general
        return "general", 0.5, "No clear classification pattern", "acknowledge"


# Example usage
if __name__ == "__main__":
    classifier = ChatClassifier()
    
    # Test cases
    test_messages = [
        "185 for 8",
        "How do I improve my bench press?",
        "I want to build muscle and lose fat",
        "Thanks!",
        "bench press 225 pounds 5 reps",
        "What's a good program for beginners?",
    ]
    
    for msg in test_messages:
        message_type, confidence, reasoning, action = classifier.classify(msg, "test_user")
        print(f"\nMessage: {msg}")
        print(f"Type: {message_type} (confidence: {confidence:.2f})")
        print(f"Reasoning: {reasoning}")
        print(f"Action: {action}")

