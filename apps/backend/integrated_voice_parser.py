"""
Integrated Voice Parser with Session Management

This class integrates voice parsing with workout session management and database logging.
Uses Kimi K2 Thinking model for voice parsing.

Features:
- Session-aware parsing (tracks current exercise, previous sets)
- Auto-save high-confidence sets to database
- "Same weight" reference handling with session context
- Exercise name matching via Upstash Search (452 exercises)
- Session summaries and statistics
- Edge case detection and handling
"""

import os
import json
import time
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
from supabase import Client
from upstash_search import Search
from dotenv import load_dotenv

load_dotenv()

# Kimi AI configuration
KIMI_API_KEY = os.getenv("KIMI_API_KEY")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.ai/v1")
KIMI_MODEL_ID = os.getenv("KIMI_MODEL_ID", "kimi-k2-thinking")

# Upstash Search configuration (for exercise matching)
UPSTASH_SEARCH_URL = os.getenv("UPSTASH_SEARCH_REST_URL")
UPSTASH_SEARCH_TOKEN = os.getenv("UPSTASH_SEARCH_REST_TOKEN")

# Confidence thresholds
CONFIDENCE_THRESHOLD_HIGH = 0.85  # Auto-accept
CONFIDENCE_THRESHOLD_LOW = 0.70   # Require confirmation


class IntegratedVoiceParser:
    """
    Integrated voice parser with session management.

    Handles voice command parsing, session tracking, and database logging.
    Uses Kimi K2 Thinking model + Upstash Search for exercise matching.
    """

    def __init__(self, supabase_client: Client):
        """Initialize the integrated voice parser."""
        self.supabase = supabase_client
        self.sessions = {}  # In-memory session storage: {user_id: session_data}

        # Initialize Upstash Search client for exercise matching
        if UPSTASH_SEARCH_URL and UPSTASH_SEARCH_TOKEN:
            self.search_client = Search(
                url=UPSTASH_SEARCH_URL,
                token=UPSTASH_SEARCH_TOKEN
            )
        else:
            self.search_client = None
            print("⚠️  Upstash Search not configured - exercise matching will be limited")

        if not all([KIMI_API_KEY, KIMI_BASE_URL, KIMI_MODEL_ID]):
            raise ValueError("Missing required environment variables for voice parsing")
    
    def parse_and_log_set(
        self,
        transcript: str,
        user_id: str,
        auto_save: bool = False
    ) -> Dict[str, Any]:
        """
        Parse a voice command and optionally save to database.

        Args:
            transcript: Voice transcript to parse
            user_id: User ID for session management
            auto_save: Whether to auto-save high-confidence sets

        Returns:
            Dictionary with parsed data, confidence, action, and session context
        """
        start_time = time.time()

        # Get or create session
        session = self._get_or_create_session(user_id)

        # Check for "same weight" reference
        same_weight_detected = self._detect_same_weight(transcript)

        # Parse the transcript using Kimi
        parsed_data = self._parse_with_kimi(transcript, session, same_weight_detected)

        # Match exercise name to database using Upstash Search
        if parsed_data.get('exercise_name') and self.search_client:
            exercise_match = self._match_exercise(parsed_data['exercise_name'])
            if exercise_match:
                parsed_data['exercise_id'] = exercise_match['id']
                parsed_data['exercise_name'] = exercise_match['name']
                parsed_data['exercise_match_score'] = exercise_match['score']

        # Calculate confidence
        confidence = parsed_data.get('confidence', 0.5)

        # Determine action
        if confidence >= CONFIDENCE_THRESHOLD_HIGH:
            action = "auto_accept"
        elif confidence >= CONFIDENCE_THRESHOLD_LOW:
            action = "needs_confirmation"
        else:
            action = "needs_clarification"
        
        # Update session
        session['total_sets'] += 1
        session['last_exercise'] = parsed_data.get('exercise_name')
        session['last_weight'] = parsed_data.get('weight')
        session['last_reps'] = parsed_data.get('reps')
        
        # Check if exercise switched
        is_exercise_switch = (
            session.get('current_exercise') and
            session['current_exercise'] != parsed_data.get('exercise_name')
        )
        
        if is_exercise_switch:
            session['exercises_count'] += 1
        
        session['current_exercise'] = parsed_data.get('exercise_name')
        
        # Build session context
        session_context = {
            'session_id': session['session_id'],
            'set_number': session['total_sets'],
            'is_exercise_switch': is_exercise_switch,
            'edge_case_handled': False,
            'total_sets_in_session': session['total_sets']
        }
        
        # Auto-save if requested and confidence is high
        saved = False
        save_error = None
        
        if auto_save and confidence >= CONFIDENCE_THRESHOLD_HIGH:
            try:
                self._save_set_to_database(user_id, parsed_data, session['session_id'])
                saved = True
            except Exception as e:
                save_error = str(e)
        
        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)
        
        return {
            'success': True,
            'action': action,
            'confidence': confidence,
            'data': parsed_data,
            'transcript': transcript,
            'same_weight_detected': same_weight_detected,
            'session_context': session_context,
            'edge_case': None,
            'message': f"Parsed with {confidence:.0%} confidence",
            'saved': saved,
            'save_error': save_error,
            'latency_ms': latency_ms
        }

    def _detect_same_weight(self, transcript: str) -> bool:
        """
        Detect if user is referencing "same weight" from previous set.

        Args:
            transcript: Voice transcript

        Returns:
            True if "same weight" reference detected
        """
        same_weight_phrases = [
            'same weight',
            'same',
            'keep the weight',
            'keep weight',
            'same load'
        ]

        transcript_lower = transcript.lower()
        return any(phrase in transcript_lower for phrase in same_weight_phrases)

    def _match_exercise(self, exercise_name: str) -> Optional[Dict[str, Any]]:
        """
        Match exercise name to database using Upstash Search.

        Args:
            exercise_name: Exercise name from voice parsing

        Returns:
            Dictionary with exercise_id, name, and match score, or None
        """
        if not self.search_client:
            return None

        try:
            # Search in the "exercises" namespace (actual exercise list)
            index = self.search_client.index("exercises")
            results = index.search(query=exercise_name, limit=1)

            if results and len(results) > 0:
                top_result = results[0]
                content = top_result.content if hasattr(top_result, 'content') else {}
                return {
                    'id': top_result.id if hasattr(top_result, 'id') else None,
                    'name': content.get('original_name', exercise_name),
                    'score': top_result.score if hasattr(top_result, 'score') else 0.0
                }

            return None

        except Exception as e:
            print(f"Error matching exercise: {e}")
            return None

    def _parse_with_kimi(self, transcript: str, session: Dict, same_weight_detected: bool = False) -> Dict[str, Any]:
        """
        Parse voice transcript using Kimi K2 Thinking model.

        Args:
            transcript: Voice transcript
            session: Current session data
            same_weight_detected: Whether "same weight" was detected

        Returns:
            Parsed workout data
        """
        # Build system prompt
        system_prompt = """You are a voice command parser for workout logging. Parse the voice transcript into structured JSON.

Output format:
{
  "exercise_name": "Exercise name",
  "weight": 225,
  "weight_unit": "lbs",
  "reps": 8,
  "rpe": 8,
  "rir": 2,
  "confidence": 0.95
}

Only include fields that are mentioned in the transcript."""

        # Add session context if available
        if session.get('last_exercise'):
            system_prompt += f"\n\nCurrent exercise: {session['last_exercise']}"
            if session.get('last_weight'):
                system_prompt += f"\nLast weight: {session['last_weight']} {session.get('last_weight_unit', 'lbs')}"

        # Handle "same weight" reference
        if same_weight_detected and session.get('last_weight'):
            system_prompt += f"\n\nUser said 'same weight' - use weight: {session['last_weight']} {session.get('last_weight_unit', 'lbs')}"

        # Call Kimi model
        url = f"{KIMI_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {KIMI_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": KIMI_MODEL_ID,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            "temperature": 0.1,  # Low temperature for consistency
            "max_tokens": 300
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)

            if response.status_code != 200:
                raise Exception(f"Kimi API error: {response.status_code}")
            
            result = response.json()
            content = result['choices'][0]['message']['content']

            # Parse JSON response (handle cases where Kimi adds extra text)
            try:
                # First try direct parsing
                parsed_data = json.loads(content)
            except json.JSONDecodeError:
                # If that fails, try to extract JSON from the response
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    parsed_data = json.loads(json_match.group(0))
                else:
                    raise Exception("No valid JSON found in Kimi response")

            # Fix: Sometimes returns 'weight_value' instead of 'weight'
            if 'weight_value' in parsed_data and 'weight' not in parsed_data:
                parsed_data['weight'] = parsed_data.pop('weight_value')

            return parsed_data

        except Exception as e:
            print(f"Error parsing with Kimi: {e}")
            # Return fallback response
            return {
                'exercise_name': 'Unknown Exercise',
                'confidence': 0.3,
                'error': str(e)
            }
    
    def _get_or_create_session(self, user_id: str) -> Dict[str, Any]:
        """Get existing session or create new one."""
        if user_id not in self.sessions:
            self.sessions[user_id] = {
                'session_id': f"session_{user_id}_{int(time.time())}",
                'user_id': user_id,
                'started_at': datetime.utcnow().isoformat(),
                'total_sets': 0,
                'exercises_count': 0,
                'current_exercise': None,
                'last_exercise': None,
                'last_weight': None,
                'last_reps': None,
                'last_weight_unit': 'lbs'
            }
        
        return self.sessions[user_id]
    
    def get_session_summary(self, user_id: str) -> Dict[str, Any]:
        """Get current session summary for a user."""
        session = self.sessions.get(user_id)
        
        if not session:
            return {
                'session_id': None,
                'started_at': None,
                'total_sets': 0,
                'current_exercise': None,
                'exercises_count': 0
            }
        
        return {
            'session_id': session['session_id'],
            'started_at': session['started_at'],
            'total_sets': session['total_sets'],
            'current_exercise': {
                'name': session.get('current_exercise'),
                'last_weight': session.get('last_weight'),
                'last_reps': session.get('last_reps')
            } if session.get('current_exercise') else None,
            'exercises_count': session['exercises_count']
        }
    
    def end_session(self, user_id: str) -> Dict[str, Any]:
        """End the current workout session."""
        session = self.sessions.get(user_id)
        
        if not session:
            return {'error': 'No active session found'}
        
        # Build final summary
        summary = {
            'session_id': session['session_id'],
            'user_id': user_id,
            'started_at': session['started_at'],
            'ended_at': datetime.utcnow().isoformat(),
            'total_sets': session['total_sets'],
            'exercises_count': session['exercises_count'],
            'exercises': []  # TODO: Track individual exercises
        }
        
        # Clear session
        del self.sessions[user_id]
        
        return summary
    
    def _save_set_to_database(self, user_id: str, parsed_data: Dict, session_id: str):
        """
        Save a set to the database.

        Args:
            user_id: User ID
            parsed_data: Parsed workout data
            session_id: Current session ID

        Raises:
            Exception if database save fails
        """
        try:
            # Prepare set data for database
            set_data = {
                'user_id': user_id,
                'exercise_id': parsed_data.get('exercise_id'),
                'weight': parsed_data.get('weight'),
                'weight_unit': parsed_data.get('weight_unit', 'lbs'),
                'reps': parsed_data.get('reps'),
                'rpe': parsed_data.get('rpe'),
                'rir': parsed_data.get('rir'),
                'notes': parsed_data.get('notes'),
                'session_id': session_id,
                'created_at': datetime.utcnow().isoformat()
            }

            # Remove None values
            set_data = {k: v for k, v in set_data.items() if v is not None}

            # Insert into database
            result = self.supabase.table('sets').insert(set_data).execute()

            if not result.data:
                raise Exception("Failed to save set to database")

            return result.data[0]

        except Exception as e:
            print(f"Error saving set to database: {e}")
            raise

