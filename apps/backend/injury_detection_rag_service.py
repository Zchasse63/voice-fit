"""
Injury Detection RAG Service with Grok 4 Fast Reasoning

This service handles AI-powered injury detection using:
1. Smart namespace selection (injury-specific knowledge areas)
2. Parallel Upstash Search (retrieve injury-related research and protocols)
3. Grok 4 Fast Reasoning for analysis (superior reasoning for complex medical scenarios)

Features:
- RAG-enhanced injury detection (vs. simple keyword matching)
- Context-aware analysis (user's training history, previous injuries)
- Severity classification with medical reasoning
- Recovery recommendations based on research
- Exercise modification suggestions

Used for Premium tier users. Free tier uses basic keyword matching (InjuryDetectionService.ts in mobile).
"""

import concurrent.futures
import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from upstash_search import Search

load_dotenv()

# Configuration
UPSTASH_SEARCH_URL = os.getenv("UPSTASH_SEARCH_REST_URL")
UPSTASH_SEARCH_TOKEN = os.getenv("UPSTASH_SEARCH_REST_TOKEN")
XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_BASE_URL = "https://api.x.ai/v1"
GROK_MODEL_ID = "grok-4-fast-reasoning"

# Injury-specific namespaces for RAG (expanded for sports-specific coverage)
INJURY_NAMESPACES = [
    "injury-analysis",  # Injury detection and diagnosis
    "injury-prevention",  # Prevention strategies
    "injury-management",  # Recovery protocols
    "exercise-substitution",  # Safe exercise alternatives
    "mobility-flexibility",  # Mobility work for recovery
    "recovery-and-performance",  # Recovery science
    "powerlifting-injuries",  # Powerlifting-specific injury patterns
    "olympic-lifting-injuries",  # Olympic lifting injury patterns
    "running-injuries",  # Running and endurance sport injuries
    "crossfit-injuries",  # CrossFit-specific injury patterns
    "bodybuilding-injuries",  # Bodybuilding and hypertrophy training injuries
]

# Confidence calibration history (tracks accuracy over time)
CONFIDENCE_CALIBRATION_FILE = "injury_confidence_history.json"


class InjuryDetectionRAGService:
    """AI-powered injury detection service with RAG capabilities"""

    def __init__(self, supabase_client: Optional[Any] = None):
        """Initialize Injury Detection RAG service"""
        self.upstash_url = UPSTASH_SEARCH_URL
        self.upstash_token = UPSTASH_SEARCH_TOKEN
        self.xai_api_key = XAI_API_KEY
        self.xai_base_url = XAI_BASE_URL
        self.model_id = GROK_MODEL_ID
        self.supabase = supabase_client
        self.confidence_history = self._load_confidence_history()

        if not all([self.upstash_url, self.upstash_token, self.xai_api_key]):
            raise ValueError(
                "Missing required environment variables for Injury Detection RAG service"
            )

    def _load_confidence_history(self) -> Dict[str, List[float]]:
        """Load confidence calibration history from file"""
        try:
            if os.path.exists(CONFIDENCE_CALIBRATION_FILE):
                with open(CONFIDENCE_CALIBRATION_FILE, "r") as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading confidence history: {e}")
        return {"predictions": [], "actual_outcomes": []}

    def _save_confidence_history(self):
        """Save confidence calibration history to file"""
        try:
            with open(CONFIDENCE_CALIBRATION_FILE, "w") as f:
                json.dump(self.confidence_history, f)
        except Exception as e:
            print(f"Error saving confidence history: {e}")

    async def fetch_injury_history(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch user's injury history from Supabase.

        Args:
            user_id: User ID

        Returns:
            List of previous injuries with details
        """
        if not self.supabase:
            return []

        try:
            response = (
                self.supabase.table("injury_logs")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(10)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            print(f"Error fetching injury history: {e}")
            return []

    async def fetch_training_load_data(
        self, user_id: str, days: int = 14
    ) -> Dict[str, Any]:
        """
        Fetch user's recent training load data from Supabase.

        Args:
            user_id: User ID
            days: Number of days to look back

        Returns:
            Training load metrics (volume, intensity, frequency)
        """
        if not self.supabase:
            return {}

        try:
            from datetime import datetime, timedelta

            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

            # Fetch recent workout logs
            workout_response = (
                self.supabase.table("workout_logs")
                .select("id, exercise_name, created_at")
                .eq("user_id", user_id)
                .gte("created_at", cutoff_date)
                .execute()
            )

            # Fetch sets for volume calculation
            if workout_response.data:
                workout_ids = [w["id"] for w in workout_response.data]
                sets_response = (
                    self.supabase.table("sets")
                    .select("weight, reps, rpe")
                    .in_("workout_log_id", workout_ids)
                    .execute()
                )

                # Calculate training load metrics
                total_volume = sum(
                    s.get("weight", 0) * s.get("reps", 0) for s in sets_response.data
                )
                avg_rpe = (
                    sum(s.get("rpe", 0) for s in sets_response.data if s.get("rpe"))
                    / len([s for s in sets_response.data if s.get("rpe")])
                    if sets_response.data
                    else 0
                )
                workout_frequency = len(workout_response.data)

                return {
                    "total_volume_kg": total_volume,
                    "average_rpe": round(avg_rpe, 1),
                    "workout_frequency": workout_frequency,
                    "days_tracked": days,
                    "volume_per_session": (
                        round(total_volume / workout_frequency, 1)
                        if workout_frequency > 0
                        else 0
                    ),
                }

            return {}
        except Exception as e:
            print(f"Error fetching training load data: {e}")
            return {}

    def detect_sport_type(
        self, user_context: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Detect user's primary sport type based on exercise history.

        Args:
            user_context: User context including recent exercises

        Returns:
            Sport type string or None
        """
        if not user_context or "recent_exercises" not in user_context:
            return None

        exercises = [e.lower() for e in user_context.get("recent_exercises", [])]

        # Powerlifting indicators
        powerlifting_exercises = {"squat", "bench press", "deadlift"}
        if any(ex in " ".join(exercises) for ex in powerlifting_exercises):
            if (
                len(
                    [
                        e
                        for e in exercises
                        if any(pl in e for pl in powerlifting_exercises)
                    ]
                )
                >= 2
            ):
                return "powerlifting"

        # Olympic lifting indicators
        oly_exercises = {"snatch", "clean", "jerk", "clean and jerk"}
        if any(ex in " ".join(exercises) for ex in oly_exercises):
            return "olympic-lifting"

        # Running indicators
        if (
            "run" in " ".join(exercises)
            or "running" in user_context.get("sport_type", "").lower()
        ):
            return "running"

        # CrossFit indicators (mix of modalities)
        crossfit_indicators = {
            "box jump",
            "muscle up",
            "thruster",
            "wall ball",
            "burpee",
        }
        if any(ex in " ".join(exercises) for ex in crossfit_indicators):
            return "crossfit"

        # Bodybuilding indicators (isolation work)
        bodybuilding_exercises = {"curl", "fly", "extension", "raise", "pulldown"}
        isolation_count = sum(
            1 for e in exercises if any(bb in e for bb in bodybuilding_exercises)
        )
        if isolation_count >= 3:
            return "bodybuilding"

        return None

    def select_relevant_namespaces(
        self, notes: str, sport_type: Optional[str] = None
    ) -> List[str]:
        """
        Select most relevant injury namespaces based on notes content and sport type.

        Args:
            notes: User's injury notes from readiness check-in
            sport_type: Optional detected sport type for sport-specific namespaces

        Returns:
            List of 2-5 most relevant namespaces to search
        """
        notes_lower = notes.lower()
        selected = []

        # Always include core injury analysis
        selected.append("injury-analysis")

        # Check for specific injury types
        if any(
            word in notes_lower
            for word in ["strain", "tear", "pull", "sprain", "tendon", "muscle"]
        ):
            selected.append("injury-management")

        # Check for prevention/chronic issues
        if any(
            word in notes_lower
            for word in ["prevent", "keep", "recurring", "chronic", "always"]
        ):
            selected.append("injury-prevention")

        # Check for exercise modification needs
        if any(
            word in notes_lower
            for word in ["substitute", "alternative", "replace", "modify", "can't do"]
        ):
            selected.append("exercise-substitution")

        # Check for mobility/flexibility issues
        if any(
            word in notes_lower
            for word in [
                "tight",
                "stiff",
                "mobility",
                "range of motion",
                "rom",
                "flexibility",
            ]
        ):
            selected.append("mobility-flexibility")

        # Check for recovery focus
        if any(
            word in notes_lower
            for word in ["heal", "recover", "rehab", "getting better", "improving"]
        ):
            selected.append("recovery-and-performance")

        # Add sport-specific namespace if detected
        if sport_type:
            sport_namespace = f"{sport_type}-injuries"
            if sport_namespace in INJURY_NAMESPACES and sport_namespace not in selected:
                selected.append(sport_namespace)

        # Ensure at least 2 namespaces (add injury-management if only 1)
        if len(selected) == 1:
            selected.append("injury-management")

        return selected[:5]  # Limit to 5 for performance (increased for sport coverage)

    def search_single_namespace(
        self, namespace: str, query: str, top_k: int
    ) -> List[Dict]:
        """
        Search a single namespace (for parallel execution).

        Args:
            namespace: Upstash namespace to search
            query: Search query (injury notes)
            top_k: Number of results to retrieve

        Returns:
            List of search results with text, score, and namespace
        """
        try:
            client = Search(url=self.upstash_url, token=self.upstash_token)
            index = client.index(namespace)
            results = index.search(query=query, limit=top_k)

            namespace_results = []
            for result in results:
                if result.content and result.content.get("text"):
                    namespace_results.append(
                        {
                            "text": result.content["text"],
                            "score": result.score,
                            "namespace": namespace,
                        }
                    )
            return namespace_results
        except Exception as e:
            print(f"Error searching namespace {namespace}: {e}")
            return []

    def retrieve_injury_context(
        self, notes: str, namespaces: List[str], top_k: int = 5
    ) -> Tuple[List[str], List[str], float]:
        """
        Retrieve injury-related context from Upstash Search using PARALLEL searches.

        Args:
            notes: User's injury notes
            namespaces: List of namespaces to search
            top_k: Number of top results to return

        Returns:
            - List of context strings (research snippets)
            - List of source namespaces used
            - Retrieval latency in ms
        """
        start_time = time.time()

        # Execute all namespace searches in parallel
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=len(namespaces)
        ) as executor:
            futures = [
                executor.submit(self.search_single_namespace, ns, notes, top_k)
                for ns in namespaces
            ]
            all_results = []
            for future in concurrent.futures.as_completed(futures):
                all_results.extend(future.result())

        latency = (time.time() - start_time) * 1000

        # Sort by relevance score and take top results
        all_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = all_results[:top_k]

        # Format context strings and track sources
        context_strings = []
        sources = []
        for i, result in enumerate(top_results, 1):
            # Include full text for better context (injury analysis needs details)
            context_strings.append(
                f"[Research Context {i} from {result['namespace']}]:\n{result['text']}"
            )
            if result["namespace"] not in sources:
                sources.append(result["namespace"])

        return context_strings, sources, latency

    def detect_multiple_injuries(self, notes: str) -> List[str]:
        """
        Detect if notes mention multiple distinct injuries.

        Args:
            notes: User's injury notes

        Returns:
            List of distinct injury descriptions to analyze separately
        """
        # Common separators for multiple injuries
        separators = [" and ", ", ", " also ", " plus "]

        # Body part keywords that indicate separate injuries
        body_parts = [
            "shoulder",
            "elbow",
            "wrist",
            "back",
            "hip",
            "knee",
            "ankle",
            "hamstring",
            "quad",
            "calf",
            "bicep",
            "tricep",
            "chest",
            "neck",
        ]

        notes_lower = notes.lower()

        # Check for multiple body parts mentioned
        mentioned_parts = [part for part in body_parts if part in notes_lower]

        if len(mentioned_parts) >= 2:
            # Try to split by separators
            injury_segments = [notes]
            for sep in separators:
                if sep in notes_lower:
                    injury_segments = notes.split(sep)
                    break

            # Validate each segment has a body part
            valid_segments = []
            for segment in injury_segments:
                segment_lower = segment.lower()
                if any(part in segment_lower for part in body_parts):
                    valid_segments.append(segment.strip())

            if len(valid_segments) >= 2:
                return valid_segments

        # Single injury or couldn't split reliably
        return [notes]

    def generate_follow_up_questions(
        self, analysis_result: Dict[str, Any], notes: str
    ) -> List[str]:
        """
        Generate follow-up questions for ambiguous or incomplete injury reports.

        Args:
            analysis_result: Initial injury analysis from Grok
            notes: Original injury notes

        Returns:
            List of follow-up questions to ask user
        """
        questions = []
        confidence = analysis_result.get("confidence", 0.0)

        # If low confidence, ask clarifying questions
        if confidence < 0.6:
            # Missing pain characteristics
            if "sharp" not in notes.lower() and "dull" not in notes.lower():
                questions.append("Is the pain sharp and stabbing, or dull and achy?")

            # Missing timing information
            if "when" not in notes.lower() and "during" not in notes.lower():
                questions.append(
                    "When do you feel the pain? (e.g., during exercise, after, at rest)"
                )

            # Missing onset information
            if "sudden" not in notes.lower() and "gradual" not in notes.lower():
                questions.append(
                    "Did the pain start suddenly or develop gradually over time?"
                )

        # Check for missing severity indicators
        if (
            not analysis_result.get("severity")
            or analysis_result.get("severity") == "unknown"
        ):
            questions.append(
                "On a scale of 1-10, how would you rate the pain intensity?"
            )

        # Check for missing functional impact
        functional_keywords = ["can't", "unable", "difficult", "hurts to"]
        if not any(kw in notes.lower() for kw in functional_keywords):
            questions.append(
                "What movements or activities does this injury prevent you from doing?"
            )

        # Ask about previous similar injuries if not mentioned
        if "before" not in notes.lower() and "previous" not in notes.lower():
            questions.append("Have you experienced this type of injury before?")

        # Limit to top 3 most important questions
        return questions[:3]

    def calibrate_confidence(
        self, predicted_confidence: float, actual_outcome: bool
    ) -> float:
        """
        Calibrate confidence scores based on historical accuracy.

        Args:
            predicted_confidence: Model's predicted confidence (0.0-1.0)
            actual_outcome: Whether the prediction was accurate (True/False)

        Returns:
            Calibrated confidence score
        """
        # Store prediction and outcome
        self.confidence_history["predictions"].append(predicted_confidence)
        self.confidence_history["actual_outcomes"].append(
            1.0 if actual_outcome else 0.0
        )

        # Keep only last 100 predictions
        if len(self.confidence_history["predictions"]) > 100:
            self.confidence_history["predictions"] = self.confidence_history[
                "predictions"
            ][-100:]
            self.confidence_history["actual_outcomes"] = self.confidence_history[
                "actual_outcomes"
            ][-100:]

        # Save updated history
        self._save_confidence_history()

        # If not enough history, return original confidence
        if len(self.confidence_history["predictions"]) < 10:
            return predicted_confidence

        # Calculate calibration factor
        # Group predictions into bins and check accuracy
        predictions = self.confidence_history["predictions"]
        outcomes = self.confidence_history["actual_outcomes"]

        # Simple calibration: if model is overconfident, reduce; if underconfident, increase
        avg_prediction = sum(predictions) / len(predictions)
        avg_outcome = sum(outcomes) / len(outcomes)

        calibration_factor = avg_outcome / avg_prediction if avg_prediction > 0 else 1.0

        # Apply calibration (with limits)
        calibrated = predicted_confidence * calibration_factor
        return max(0.1, min(0.95, calibrated))  # Keep in reasonable range

    def analyze_injury_with_grok(
        self,
        notes: str,
        context: List[str],
        user_context: Optional[Dict[str, Any]] = None,
        injury_history: Optional[List[Dict[str, Any]]] = None,
        training_load: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], float]:
        """
        Analyze injury using Grok 4 Fast Reasoning with RAG context.

        Args:
            notes: User's injury description
            context: Retrieved research context from Upstash
            user_context: User's training history, previous injuries, etc.
            injury_history: User's previous injury records
            training_load: Recent training load metrics

        Returns:
            - Structured injury analysis result
            - Inference latency in ms
        """
        start_time = time.time()

        # Build system prompt with medical reasoning instructions
        system_prompt = """You are an expert sports medicine AI assistant specializing in injury detection and analysis for strength training athletes.

Your task is to analyze user notes and detect potential injuries using evidence-based reasoning.

RESPONSE FORMAT (JSON):
{
  "injury_detected": true/false,
  "confidence": 0.0-1.0,
  "body_part": "specific body part (e.g., 'shoulder', 'lower_back', 'knee')",
  "injury_type": "type of injury (e.g., 'strain', 'tendinitis', 'impingement')",
  "severity": "mild/moderate/severe",
  "description": "Clear explanation of detected injury",
  "reasoning": "Your medical reasoning process",
  "red_flags": ["list of concerning symptoms if any"],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ],
  "exercise_modifications": [
    "Suggested exercise modification 1",
    "Suggested exercise modification 2"
  ],
  "recovery_timeline": "estimated recovery timeline (e.g., '2-4 weeks')",
  "should_see_doctor": true/false,
  "related_to_previous_injury": true/false,
  "overtraining_indicator": true/false
}

GUIDELINES:
1. Use the provided research context to inform your analysis
2. Consider user's training history and previous injuries if provided
3. Distinguish between normal DOMS and actual injury
4. Be conservative - if uncertain, suggest medical consultation
5. Provide actionable, specific recommendations
6. Base severity on functional impact and symptom description
7. Consider injury mechanism (acute vs. chronic/overuse)

SEVERITY CLASSIFICATION:
- Mild: Minor discomfort, minimal functional impact, can train around it
- Moderate: Noticeable pain, limiting some movements, requires modification
- Severe: Significant pain, major functional limitation, needs rest/medical attention

RED FLAGS (always recommend doctor):
- Sharp, intense pain during movement
- Sudden onset with "pop" or "tear" sensation
- Significant swelling or bruising
- Loss of range of motion
- Weakness or instability
- Numbness or tingling
- Pain at night or at rest
- Symptoms persisting >2 weeks without improvement"""

        # Build user message with context
        user_message = f"""INJURY NOTES:
{notes}

RESEARCH CONTEXT:
{chr(10).join(context)}"""

        # Add user context if available
        if user_context:
            user_message += f"""

USER CONTEXT:
- Training Experience: {user_context.get("experience_level", "unknown")}
- Recent Workouts: {user_context.get("recent_workouts", "N/A")}
- Previous Injuries: {user_context.get("previous_injuries", "None reported")}
- Current Recovery Week: {user_context.get("recovery_week", "N/A")}
- Current Pain Level: {user_context.get("pain_level", "Not specified")}/10"""

        # Add injury history if available
        if injury_history and len(injury_history) > 0:
            user_message += "\n\nINJURY HISTORY:"
            for idx, injury in enumerate(injury_history[:5], 1):
                user_message += f"""
- Injury {idx}: {injury.get("body_part", "Unknown")} {injury.get("injury_type", "")}
  Severity: {injury.get("severity", "Unknown")}
  Date: {injury.get("created_at", "Unknown")[:10]}
  Status: {injury.get("status", "Unknown")}"""

        # Add training load data if available
        if training_load and training_load.get("total_volume_kg"):
            user_message += f"""

RECENT TRAINING LOAD ({training_load.get("days_tracked", 14)} days):
- Total Volume: {training_load.get("total_volume_kg", 0):,.0f} kg
- Average RPE: {training_load.get("average_rpe", 0)}/10
- Workout Frequency: {training_load.get("workout_frequency", 0)} sessions
- Volume per Session: {training_load.get("volume_per_session", 0):,.0f} kg

Consider if current injury may be related to training load, volume spikes, or overtraining."""

        # Prepare messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        # Call Grok 4 Fast Reasoning
        try:
            headers = {
                "Authorization": f"Bearer {self.xai_api_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": self.model_id,
                "messages": messages,
                "temperature": 0.3,  # Lower temperature for medical analysis
                "max_tokens": 2000,
                "stream": False,  # Non-streaming for structured JSON response
            }

            response = requests.post(
                f"{self.xai_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30,
            )

            response.raise_for_status()
            result = response.json()

            # Extract response content
            content = result["choices"][0]["message"]["content"]

            # Parse JSON response
            # Handle markdown code blocks if present
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            analysis_result = json.loads(json_str)

            latency = (time.time() - start_time) * 1000

            return analysis_result, latency

        except requests.exceptions.RequestException as e:
            print(f"Error calling Grok API: {e}")
            latency = (time.time() - start_time) * 1000
            # Return fallback result
            return {
                "injury_detected": False,
                "confidence": 0.0,
                "body_part": None,
                "injury_type": None,
                "severity": None,
                "description": f"Error analyzing injury: {str(e)}",
                "reasoning": "API error occurred",
                "red_flags": [],
                "recommendations": [
                    "Please try again or consult a medical professional"
                ],
                "exercise_modifications": [],
                "recovery_timeline": None,
                "should_see_doctor": False,
            }, latency
        except json.JSONDecodeError as e:
            print(f"Error parsing Grok response as JSON: {e}")
            print(f"Raw response: {content}")
            latency = (time.time() - start_time) * 1000
            return {
                "injury_detected": False,
                "confidence": 0.0,
                "body_part": None,
                "injury_type": None,
                "severity": None,
                "description": "Error parsing AI response",
                "reasoning": "JSON parsing error",
                "red_flags": [],
                "recommendations": ["Please try again"],
                "exercise_modifications": [],
                "recovery_timeline": None,
                "should_see_doctor": False,
            }, latency

    async def analyze_injury(
        self,
        notes: str,
        user_id: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Full injury detection pipeline with RAG and enhanced features.

        Args:
            notes: User's injury notes from readiness check-in
            user_id: User ID for fetching history and training load
            user_context: Optional user context (training history, previous injuries)

        Returns:
            - Injury analysis result (structured, may contain multiple injuries)
            - Metadata (sources, latencies, etc.)
        """
        # Step 0: Fetch injury history and training load if user_id provided
        injury_history = []
        training_load = {}
        if user_id:
            injury_history = await self.fetch_injury_history(user_id)
            training_load = await self.fetch_training_load_data(user_id)

        # Step 1: Detect multiple injuries
        injury_segments = self.detect_multiple_injuries(notes)

        # If multiple injuries detected, analyze each separately
        if len(injury_segments) > 1:
            all_results = []
            total_retrieval_latency = 0
            total_inference_latency = 0
            all_namespaces = []
            all_sources = []

            for segment in injury_segments:
                # Detect sport type
                sport_type = self.detect_sport_type(user_context)

                # Select relevant namespaces
                namespaces = self.select_relevant_namespaces(segment, sport_type)
                all_namespaces.extend(namespaces)

                # Retrieve context
                context, sources, retrieval_latency = self.retrieve_injury_context(
                    notes=segment, namespaces=namespaces, top_k=3
                )
                all_sources.extend(sources)
                total_retrieval_latency += retrieval_latency

                # Analyze with Grok
                analysis_result, inference_latency = self.analyze_injury_with_grok(
                    notes=segment,
                    context=context,
                    user_context=user_context,
                    injury_history=injury_history,
                    training_load=training_load,
                )
                total_inference_latency += inference_latency

                # Calibrate confidence if we have history
                if len(self.confidence_history["predictions"]) >= 10:
                    original_confidence = analysis_result.get("confidence", 0.5)
                    # For calibration, we'd need feedback - for now, just track
                    analysis_result["original_confidence"] = original_confidence

                # Generate follow-up questions
                analysis_result["follow_up_questions"] = (
                    self.generate_follow_up_questions(analysis_result, segment)
                )

                all_results.append(analysis_result)

            # Build combined metadata
            metadata = {
                "multiple_injuries_detected": True,
                "injury_count": len(all_results),
                "namespaces_searched": list(set(all_namespaces)),
                "sources_used": list(set(all_sources)),
                "retrieval_latency_ms": round(total_retrieval_latency, 2),
                "inference_latency_ms": round(total_inference_latency, 2),
                "total_latency_ms": round(
                    total_retrieval_latency + total_inference_latency, 2
                ),
                "model_used": self.model_id,
                "rag_enabled": True,
                "sport_type": sport_type,
                "injury_history_available": len(injury_history) > 0,
                "training_load_available": bool(training_load),
            }

            return {"injuries": all_results}, metadata

        # Single injury - proceed with normal flow
        # Detect sport type
        sport_type = self.detect_sport_type(user_context)

        # Select relevant namespaces
        namespaces = self.select_relevant_namespaces(notes, sport_type)

        # Step 2: Retrieve context from Upstash (RAG)
        context, sources, retrieval_latency = self.retrieve_injury_context(
            notes=notes, namespaces=namespaces, top_k=5
        )

        # Step 3: Analyze with Grok 4 Fast Reasoning
        analysis_result, inference_latency = self.analyze_injury_with_grok(
            notes=notes,
            context=context,
            user_context=user_context,
            injury_history=injury_history,
            training_load=training_load,
        )

        # Step 4: Calibrate confidence if we have history
        if len(self.confidence_history["predictions"]) >= 10:
            original_confidence = analysis_result.get("confidence", 0.5)
            # For calibration, we'd need feedback - for now, just track
            analysis_result["original_confidence"] = original_confidence

        # Step 5: Generate follow-up questions for ambiguous cases
        analysis_result["follow_up_questions"] = self.generate_follow_up_questions(
            analysis_result, notes
        )

        # Build metadata
        metadata = {
            "multiple_injuries_detected": False,
            "injury_count": 1,
            "namespaces_searched": namespaces,
            "sources_used": sources,
            "retrieval_latency_ms": round(retrieval_latency, 2),
            "inference_latency_ms": round(inference_latency, 2),
            "total_latency_ms": round(retrieval_latency + inference_latency, 2),
            "model_used": self.model_id,
            "rag_enabled": True,
            "sport_type": sport_type,
            "injury_history_available": len(injury_history) > 0,
            "training_load_available": bool(training_load),
        }

        return analysis_result, metadata


# Singleton instance
_injury_detection_service = None


def get_injury_detection_service(
    supabase_client: Optional[Any] = None,
) -> InjuryDetectionRAGService:
    """Get or create singleton instance of InjuryDetectionRAGService"""
    global _injury_detection_service
    if _injury_detection_service is None:
        _injury_detection_service = InjuryDetectionRAGService(supabase_client)
    return _injury_detection_service


def record_confidence_feedback(
    predicted_confidence: float, was_accurate: bool
) -> float:
    """
    Record feedback on a prediction for confidence calibration.

    Args:
        predicted_confidence: The confidence score that was predicted
        was_accurate: Whether the prediction turned out to be accurate

    Returns:
        Calibrated confidence score for future predictions
    """
    service = get_injury_detection_service()
    return service.calibrate_confidence(predicted_confidence, was_accurate)
