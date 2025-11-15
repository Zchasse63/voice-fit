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

# Injury-specific namespaces for RAG
INJURY_NAMESPACES = [
    "injury-analysis",  # Injury detection and diagnosis
    "injury-prevention",  # Prevention strategies
    "injury-management",  # Recovery protocols
    "exercise-substitution",  # Safe exercise alternatives
    "mobility-flexibility",  # Mobility work for recovery
    "recovery-and-performance",  # Recovery science
]


class InjuryDetectionRAGService:
    """AI-powered injury detection service with RAG capabilities"""

    def __init__(self):
        """Initialize Injury Detection RAG service"""
        self.upstash_url = UPSTASH_SEARCH_URL
        self.upstash_token = UPSTASH_SEARCH_TOKEN
        self.xai_api_key = XAI_API_KEY
        self.xai_base_url = XAI_BASE_URL
        self.model_id = GROK_MODEL_ID

        if not all([self.upstash_url, self.upstash_token, self.xai_api_key]):
            raise ValueError(
                "Missing required environment variables for Injury Detection RAG service"
            )

    def select_relevant_namespaces(self, notes: str) -> List[str]:
        """
        Select most relevant injury namespaces based on notes content.

        Args:
            notes: User's injury notes from readiness check-in

        Returns:
            List of 2-4 most relevant namespaces to search
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

        # Ensure at least 2 namespaces (add injury-management if only 1)
        if len(selected) == 1:
            selected.append("injury-management")

        return selected[:4]  # Limit to 4 for performance

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

    def analyze_injury_with_grok(
        self,
        notes: str,
        context: List[str],
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, Any], float]:
        """
        Analyze injury using Grok 4 Fast Reasoning with RAG context.

        Args:
            notes: User's injury description
            context: Retrieved research context from Upstash
            user_context: User's training history, previous injuries, etc.

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
  "should_see_doctor": true/false
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

    def analyze_injury(
        self, notes: str, user_context: Optional[Dict[str, Any]] = None
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Full injury detection pipeline with RAG.

        Args:
            notes: User's injury notes from readiness check-in
            user_context: Optional user context (training history, previous injuries)

        Returns:
            - Injury analysis result (structured)
            - Metadata (sources, latencies, etc.)
        """
        # Step 1: Select relevant namespaces
        namespaces = self.select_relevant_namespaces(notes)

        # Step 2: Retrieve context from Upstash (RAG)
        context, sources, retrieval_latency = self.retrieve_injury_context(
            notes=notes, namespaces=namespaces, top_k=5
        )

        # Step 3: Analyze with Grok 4 Fast Reasoning
        analysis_result, inference_latency = self.analyze_injury_with_grok(
            notes=notes, context=context, user_context=user_context
        )

        # Build metadata
        metadata = {
            "namespaces_searched": namespaces,
            "sources_used": sources,
            "retrieval_latency_ms": round(retrieval_latency, 2),
            "inference_latency_ms": round(inference_latency, 2),
            "total_latency_ms": round(retrieval_latency + inference_latency, 2),
            "model_used": self.model_id,
            "rag_enabled": True,
        }

        return analysis_result, metadata


# Singleton instance
_injury_detection_service = None


def get_injury_detection_service() -> InjuryDetectionRAGService:
    """Get or create singleton instance of InjuryDetectionRAGService"""
    global _injury_detection_service
    if _injury_detection_service is None:
        _injury_detection_service = InjuryDetectionRAGService()
    return _injury_detection_service
