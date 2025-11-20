"""
PersonalityEngine - Generates personalized, conversational responses for VoiceFit

This engine creates a consistent coach persona across all user interactions:
- Onboarding conversations
- AI Coach responses
- Chat interactions
- Notifications

Core Personality Traits:
1. Knowledgeable but Approachable
2. Encouraging and Supportive
3. Conversational and Natural
4. Smart and Contextual
5. Duolingo-Inspired (friendly, not guilt-tripping)
"""

import os
import json
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class PersonalityEngine:
    """
    Generates personalized, conversational responses based on user context.
    
    Uses Grok 4 Fast Reasoning to create natural, engaging conversations
    that adapt to the user's experience level and situation.
    """
    
    def __init__(self):
        """Initialize PersonalityEngine with Grok API"""
        self.xai_api_key = os.getenv("XAI_API_KEY")
        self.xai_base_url = "https://api.x.ai/v1"
        self.model_id = "grok-4-fast-reasoning"
        
        if not self.xai_api_key:
            raise ValueError("XAI_API_KEY environment variable is required")
        
        # Tone profiles for different experience levels
        self.tone_profiles = {
            "beginner": {
                "style": "educational, encouraging, patient",
                "vocabulary": "simple, avoid jargon, explain concepts",
                "examples": "use analogies, break down complex ideas"
            },
            "intermediate": {
                "style": "technical but friendly, motivating",
                "vocabulary": "moderate technical terms, assume basic knowledge",
                "examples": "reference common training experiences"
            },
            "advanced": {
                "style": "highly technical, performance-focused",
                "vocabulary": "full technical terminology, cite research",
                "examples": "discuss nuances, advanced programming concepts"
            }
        }
    
    def generate_response(
        self,
        base_question: str,
        user_context: Dict[str, Any],
        previous_answer: Optional[str] = None,
        conversation_type: str = "onboarding"
    ) -> str:
        """
        Generate a personalized response that feels like a real conversation.
        
        Args:
            base_question: The core question to ask (e.g., "What are your training goals?")
            user_context: User's context (experience_level, goals, injuries, etc.)
            previous_answer: User's previous response (to acknowledge and reference)
            conversation_type: Type of conversation (onboarding, coaching, injury_discussion)
        
        Returns:
            Personalized, conversational response
        """
        # Get tone profile based on experience level
        experience_level = user_context.get("experience_level", "intermediate")
        tone = self.tone_profiles.get(experience_level, self.tone_profiles["intermediate"])
        
        # Build personality prompt
        prompt = self._build_personality_prompt(
            base_question=base_question,
            user_context=user_context,
            previous_answer=previous_answer,
            tone=tone,
            conversation_type=conversation_type
        )
        
        # Call Grok to generate response
        response = self._call_grok(prompt)
        return response
    
    def _build_personality_prompt(
        self,
        base_question: str,
        user_context: Dict[str, Any],
        previous_answer: Optional[str],
        tone: Dict[str, str],
        conversation_type: str
    ) -> str:
        """Build the complete personality prompt for Grok"""
        
        # Core personality traits
        personality_traits = """You are a friendly, knowledgeable fitness coach having a conversation with a user.

PERSONALITY TRAITS:
- Conversational and natural (use contractions like "you're", "let's", "we'll")
- Encouraging and supportive (celebrate progress, constructive on setbacks)
- Knowledgeable but not condescending (expert without being preachy)
- References user's specific situation (goals, injuries, experience)
- Asks follow-up questions naturally when relevant
"""
        
        # Add conversation-specific context
        if conversation_type == "onboarding":
            context_note = "You're helping them get started with VoiceFit and building their first program."
        elif conversation_type == "injury_discussion":
            context_note = "You're discussing their injury with empathy and providing practical guidance."
        else:
            context_note = "You're their ongoing coach, helping them improve and reach their goals."
        
        prompt = f"""{personality_traits}

CONTEXT: {context_note}

USER CONTEXT:
{json.dumps(user_context, indent=2)}

TONE PROFILE FOR THIS USER:
- Style: {tone['style']}
- Vocabulary: {tone['vocabulary']}
- Examples: {tone['examples']}
"""
        
        # Add previous answer acknowledgment
        if previous_answer:
            prompt += f"""
PREVIOUS USER ANSWER: "{previous_answer}"

IMPORTANT: Acknowledge their answer naturally before asking the next question.
Reference specific details they mentioned to show you're listening.
"""
        else:
            prompt += "\nThis is the first message in the conversation.\n"
        
        # Add the question to ask
        prompt += f"""
NEXT QUESTION TO ASK: {base_question}

Generate a response that:
1. Acknowledges/responds to their previous answer (if any) with specific details
2. Naturally transitions to the next question
3. Feels like a real conversation, not a form
4. Is concise (2-3 sentences max)
5. Uses their name if available: {user_context.get('user_name', '')}

Return ONLY the conversational response text. No JSON, no explanations.
"""
        
        return prompt
    
    def _call_grok(self, prompt: str) -> str:
        """Call Grok API to generate response"""
        url = f"{self.xai_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.xai_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_id,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.8,  # Higher temperature for more natural, varied responses
            "max_tokens": 200
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Grok API error: {response.status_code} - {response.text}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()

    def get_off_topic_response(self, query: str, off_topic_category: Optional[str] = None) -> str:
        """
        Generate humorous response for off-topic queries

        Args:
            query: User's off-topic query
            off_topic_category: Category of off-topic query (weather, news, etc.)

        Returns:
            Humorous redirect response
        """
        # Category-specific responses
        category_responses = {
            "weather": [
                "I'm a fitness coach, not a meteorologist! But I can predict you'll feel amazing after today's workout. ☀️",
                "The only forecast I care about is 100% chance of gains! Let's talk training instead. 💪",
                "I don't do weather reports, but I can tell you it's always a good day for a workout! 🏋️"
            ],
            "recipe": [
                "I'm better at prescribing workouts than recipes! But I can help you hit your macro targets. 🍳",
                "My specialty is building muscle, not building meals! Want to talk nutrition goals instead? 🥗",
                "I leave the cooking to the chefs - I'm here to help you get stronger! 💪"
            ],
            "news": [
                "I'm not up on current events, but I am up on current training methods! Want to talk fitness? 📰",
                "The only news I follow is your PR updates! Let's focus on your progress. 🎯",
                "I'm more interested in your personal records than world records! What are you training for? 🏆"
            ],
            "entertainment": [
                "I'm not much for entertainment - unless you count watching PRs get crushed! 🎬",
                "The only show I care about is your workout performance! Let's talk training. 🎭",
                "I'm programmed for fitness, not film reviews! What's your training goal? 🎪"
            ],
            "politics": [
                "I stay out of politics - my only agenda is helping you get stronger! 💪",
                "The only campaign I'm running is your training program! Let's focus on fitness. 🗳️",
                "I'm neutral on politics, but strongly pro-gains! Want to talk training? 🏋️"
            ],
            "travel": [
                "The only journey I care about is your fitness journey! Where are you headed with your training? ✈️",
                "I don't book trips, but I can help you plan your training roadmap! 🗺️",
                "My expertise is in training destinations, not travel destinations! Let's talk goals. 🧳"
            ],
            "shopping": [
                "I don't do shopping advice, but I can help you invest in your fitness! 🛍️",
                "The only thing I'm selling is the idea that you can crush your goals! Let's train. 💪",
                "I'm not a shopping assistant, but I can help you shop for new PRs! 🎯"
            ]
        }

        # Generic responses for other categories
        generic_responses = [
            "That's outside my wheelhouse! I'm better at counting reps than counting... well, anything else. 😅",
            "Nice try! But I'm programmed to help you get stronger, not to answer that. What's your fitness goal? 💪",
            "I'm flattered you think I know about that, but I'm just a simple AI coach. Let's talk gains! 🏋️",
            "I'd love to help, but my expertise is in burpees, not that! Want to discuss your training instead? 🤸",
            "That's a great question for someone else! I'm here to help you crush your fitness goals. 🎯"
        ]

        # Select response based on category
        if off_topic_category and off_topic_category in category_responses:
            import random
            return random.choice(category_responses[off_topic_category])
        else:
            import random
            return random.choice(generic_responses)

