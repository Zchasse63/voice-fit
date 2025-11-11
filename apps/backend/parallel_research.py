"""
Parallel Deep Research Integration for VoiceFit

This module provides evidence-based research capabilities for:
- Injury protocols and rehabilitation
- Exercise modifications and substitutions
- Recovery timelines and validation
- Differential diagnosis support
"""

import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from parallel import Parallel


class ParallelResearchService:
    """Service for conducting deep research using Parallel API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Parallel research service
        
        Args:
            api_key: Parallel API key (defaults to env var PARALLEL_API_KEY)
        """
        self.api_key = api_key or os.getenv("PARALLEL_API_KEY")
        if not self.api_key:
            raise ValueError("PARALLEL_API_KEY must be provided or set in environment")
        
        self.client = Parallel(api_key=self.api_key)
        self._cache = {}  # Simple in-memory cache
        self._cache_ttl = timedelta(hours=24)  # Cache for 24 hours
    
    def _get_cache_key(self, query: str, schema: Optional[Dict] = None) -> str:
        """Generate cache key from query and schema"""
        schema_str = json.dumps(schema, sort_keys=True) if schema else ""
        return f"{query}:{schema_str}"
    
    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if "timestamp" not in cache_entry:
            return False
        
        cached_time = datetime.fromisoformat(cache_entry["timestamp"])
        return datetime.now() - cached_time < self._cache_ttl
    
    def research_injury_protocol(
        self,
        injury_name: str,
        body_part: str,
        severity: str = "moderate",
        processor: str = "core"
    ) -> Dict[str, Any]:
        """
        Research evidence-based protocols for a specific injury

        Args:
            injury_name: Name of the injury (e.g., "rotator cuff tendinitis")
            body_part: Affected body part (e.g., "shoulder")
            severity: Injury severity (mild, moderate, severe)
            processor: Processor tier to use (default: "core")
                      Options: "lite" ($5/1K), "base" ($10/1K), "core" ($25/1K),
                               "core2x" ($50/1K), "pro" ($100/1K), "ultra" ($300/1K),
                               "ultra2x" ($600/1K), "ultra4x" ($1200/1K), "ultra8x" ($2400/1K)

        Returns:
            Structured research results with protocols, timelines, and evidence
        """
        query = f"""
        Research the latest evidence-based rehabilitation protocol for {injury_name} 
        affecting the {body_part}. Severity: {severity}.
        
        Include:
        1. Recommended exercise modifications
        2. Typical recovery timeline with phases
        3. Load reduction percentages
        4. Red flags that require medical attention
        5. Evidence quality (cite recent studies if available)
        """
        
        schema = {
            "type": "object",
            "properties": {
                "injury_summary": {
                    "type": "string",
                    "description": "Brief summary of the injury and its impact"
                },
                "exercise_modifications": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "avoid_exercise": {"type": "string"},
                            "substitute_exercise": {"type": "string"},
                            "reasoning": {"type": "string"}
                        }
                    },
                    "description": "Exercises to avoid and their substitutes"
                },
                "recovery_timeline": {
                    "type": "object",
                    "properties": {
                        "phase_1_weeks": {"type": "number"},
                        "phase_2_weeks": {"type": "number"},
                        "phase_3_weeks": {"type": "number"},
                        "total_weeks": {"type": "number"},
                        "phase_descriptions": {"type": "array", "items": {"type": "string"}}
                    }
                },
                "load_reduction": {
                    "type": "object",
                    "properties": {
                        "initial_reduction_percent": {"type": "number"},
                        "progression_strategy": {"type": "string"}
                    }
                },
                "red_flags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Symptoms requiring immediate medical attention"
                },
                "evidence_quality": {
                    "type": "string",
                    "description": "Quality of evidence (high, moderate, low) with citations"
                }
            },
            "required": [
                "injury_summary",
                "exercise_modifications",
                "recovery_timeline",
                "load_reduction",
                "red_flags",
                "evidence_quality"
            ],
            "additionalProperties": False
        }
        
        return self._execute_research(query, schema, processor=processor)
    
    def research_exercise_substitution(
        self,
        original_exercise: str,
        injury_constraint: str,
        training_goal: str = "strength",
        processor: str = "core"
    ) -> Dict[str, Any]:
        """
        Research evidence-based exercise substitutions

        Args:
            original_exercise: Exercise that needs substitution
            injury_constraint: The injury/limitation requiring substitution
            training_goal: Training goal (strength, hypertrophy, endurance)
            processor: Processor tier to use (default: "core")
                      Options: "lite" ($5/1K), "base" ($10/1K), "core" ($25/1K),
                               "core2x" ($50/1K), "pro" ($100/1K), "ultra" ($300/1K),
                               "ultra2x" ($600/1K), "ultra4x" ($1200/1K), "ultra8x" ($2400/1K)

        Returns:
            Structured research on alternative exercises with evidence
        """
        query = f"""
        Research evidence-based alternatives to {original_exercise} for someone with {injury_constraint}.
        Training goal: {training_goal}.
        
        Find exercises that:
        1. Target similar muscle groups
        2. Avoid aggravating the injury
        3. Maintain training stimulus
        4. Have research support for effectiveness
        """
        
        schema = {
            "type": "object",
            "properties": {
                "substitutes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "exercise_name": {"type": "string"},
                            "muscle_groups": {"type": "array", "items": {"type": "string"}},
                            "effectiveness_rating": {"type": "number", "minimum": 1, "maximum": 10},
                            "injury_safety": {"type": "string"},
                            "evidence_summary": {"type": "string"}
                        }
                    }
                },
                "biomechanical_comparison": {
                    "type": "string",
                    "description": "How substitutes compare biomechanically to original"
                },
                "recommendations": {
                    "type": "string",
                    "description": "Overall recommendation for best substitute"
                }
            },
            "required": ["substitutes", "biomechanical_comparison", "recommendations"],
            "additionalProperties": False
        }
        
        return self._execute_research(query, schema, processor=processor)
    
    def validate_recovery_timeline(
        self,
        injury_type: str,
        proposed_timeline_weeks: int,
        processor: str = "core"
    ) -> Dict[str, Any]:
        """
        Validate a proposed recovery timeline against research

        Args:
            injury_type: Type of injury
            proposed_timeline_weeks: Proposed recovery duration in weeks
            processor: Processor tier to use (default: "core")
                      Options: "lite" ($5/1K), "base" ($10/1K), "core" ($25/1K),
                               "core2x" ($50/1K), "pro" ($100/1K), "ultra" ($300/1K),
                               "ultra2x" ($600/1K), "ultra4x" ($1200/1K), "ultra8x" ($2400/1K)

        Returns:
            Validation results with research-backed timelines
        """
        query = f"""
        Research typical recovery timelines for {injury_type}.
        Compare against a proposed timeline of {proposed_timeline_weeks} weeks.
        
        Provide:
        1. Typical recovery range from research
        2. Factors affecting recovery time
        3. Assessment of proposed timeline (conservative, aggressive, appropriate)
        """
        
        schema = {
            "type": "object",
            "properties": {
                "typical_range_weeks": {
                    "type": "object",
                    "properties": {
                        "minimum": {"type": "number"},
                        "maximum": {"type": "number"},
                        "average": {"type": "number"}
                    }
                },
                "timeline_assessment": {
                    "type": "string",
                    "enum": ["too_aggressive", "appropriate", "conservative", "too_conservative"]
                },
                "factors_affecting_recovery": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "recommendations": {
                    "type": "string"
                }
            },
            "required": ["typical_range_weeks", "timeline_assessment", "factors_affecting_recovery", "recommendations"],
            "additionalProperties": False
        }
        
        return self._execute_research(query, schema, processor=processor)
    
    def _execute_research(
        self,
        query: str,
        schema: Optional[Dict] = None,
        processor: str = "base",
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Execute a research query with optional caching
        
        Args:
            query: Research query
            schema: Optional JSON schema for structured output
            processor: Processor tier ("base" or "ultra")
            use_cache: Whether to use cached results
        
        Returns:
            Research results
        """
        # Check cache
        cache_key = self._get_cache_key(query, schema)
        if use_cache and cache_key in self._cache:
            cache_entry = self._cache[cache_key]
            if self._is_cache_valid(cache_entry):
                print(f"[CACHE HIT] Returning cached results for query")
                return cache_entry["data"]
        
        # Execute research
        print(f"[API CALL] Executing research query with {processor} processor...")

        # Build task_spec if we have a schema
        task_spec = None
        if schema:
            task_spec = {
                "output_schema": {
                    "type": "json",
                    "json_schema": schema
                }
            }

        # Create task - processor is a top-level parameter
        task_run = self.client.task_run.create(
            input=query,
            processor=processor,
            task_spec=task_spec
        )

        print(f"[TASK CREATED] Run ID: {task_run.run_id}")
        print(f"[POLLING] Waiting for results (timeout: 10 minutes)...")

        # Poll for results (10 minute timeout)
        run_result = self.client.task_run.result(task_run.run_id, timeout=600)

        # Extract the actual data from the result object
        # The output can be a TaskRunJsonOutput object or other types
        output_data = run_result.output

        # Convert to dict if it's a Pydantic model
        if hasattr(output_data, 'model_dump'):
            output_data = output_data.model_dump()
        elif hasattr(output_data, 'dict'):
            output_data = output_data.dict()

        # Cache results
        if use_cache:
            self._cache[cache_key] = {
                "data": output_data,
                "timestamp": datetime.now().isoformat()
            }

        print(f"[SUCCESS] Research completed")
        return output_data

