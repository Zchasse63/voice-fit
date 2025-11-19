#!/usr/bin/env python3
"""
Smart Namespace Selector for Upstash Search

This module intelligently selects namespaces and uses metadata filtering
to retrieve the most relevant knowledge for program generation.

Strategy:
- Select 15-25 specific namespaces based on questionnaire
- Pull 2-4 chunks from each namespace (40-60 total chunks)
- Use metadata filtering (content_type, has_exercise_info) for precision
- Prioritize specialized namespaces over 'general'

Available Namespaces (41 total):
Core namespaces: general, strength-and-hypertrophy, structured-knowledge,
nutrition-and-supplementation, fitness-assessment, recovery-and-performance

Specialized: hypertrophy, powerlifting-programs, strength-training, autoregulation,
programming, sticking-points, injury-management, calisthenics, beginner-fundamentals,
fatigue-management, muscle-specific-programming, squat-technique, adherence,
injury-prevention, periodization-theory, movement-patterns, mobility-flexibility,
recovery, nutrition, program-structure, cardio-conditioning, programming-logic,
sports-performance, program-templates, recovery-protocols, periodization-concepts,
bodyweight-training, and more...

Content Types (metadata.content_type):
- principle: Foundational concepts and theories
- exercise: Specific exercise information
- programming: Program design and structure
- concept: General training concepts
- recovery: Recovery and performance optimization
"""

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from upstash_search import Search

load_dotenv()


class SmartNamespaceSelector:
    """
    Intelligently select namespaces and retrieve knowledge using metadata filtering
    """

    def __init__(self):
        self.upstash_url = os.getenv("UPSTASH_SEARCH_REST_URL")
        self.upstash_token = os.getenv("UPSTASH_SEARCH_REST_TOKEN")
        self.client = Search(url=self.upstash_url, token=self.upstash_token)

    def select_namespaces(
        self, questionnaire: Dict[str, Any]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Select namespaces based on questionnaire with retrieval config

        Returns:
            Dict mapping namespace -> {
                'top_k': int,  # Number of chunks to retrieve
                'content_types': List[str],  # Preferred content types
                'priority': int  # 1=high, 2=medium, 3=low
            }
        """
        selected = {}

        # Extract questionnaire data
        goal = questionnaire.get("primary_goal", "").lower()
        experience = questionnaire.get("experience_level", "").lower()
        injuries = questionnaire.get("injuries", [])
        weak_points = questionnaire.get("weak_points", [])
        equipment = questionnaire.get("available_equipment", [])

        # ALWAYS include these core namespaces
        selected["structured-knowledge"] = {
            "top_k": 3,
            "content_types": ["principle", "programming"],
            "priority": 1,
        }
        selected["program-structure"] = {
            "top_k": 2,
            "content_types": ["programming", "principle"],
            "priority": 1,
        }

        # Goal-based selection
        if "strength" in goal or "powerlifting" in goal:
            selected["strength-and-hypertrophy"] = {
                "top_k": 4,
                "content_types": ["programming", "principle"],
                "priority": 1,
            }
            selected["strength-training"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["powerlifting-programs"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["periodization-theory"] = {
                "top_k": 2,
                "content_types": ["principle"],
                "priority": 2,
            }
            selected["autoregulation"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        if "hypertrophy" in goal or "muscle" in goal or "bodybuilding" in goal:
            selected["hypertrophy"] = {
                "top_k": 4,
                "content_types": ["programming", "principle"],
                "priority": 1,
            }
            selected["strength-and-hypertrophy"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["muscle-specific-programming"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["volume-management"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        if "general" in goal or "fitness" in goal:
            selected["fitness-assessment"] = {
                "top_k": 3,
                "content_types": ["principle"],
                "priority": 1,
            }
            selected["beginner-fundamentals"] = {
                "top_k": 3,
                "content_types": ["principle", "programming"],
                "priority": 1,
            }
            selected["general"] = {
                "top_k": 2,
                "content_types": ["concept"],
                "priority": 3,
            }

        # Virtual goals for analytics and specialized endpoints
        if (
            "fatigue" in goal
            or "fatigue assessment" in goal
            or "fatigue management" in goal
        ):
            selected["fatigue-management"] = {
                "top_k": 4,
                "content_types": ["programming", "recovery"],
                "priority": 1,
            }
            selected["recovery-and-performance"] = {
                "top_k": 3,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["autoregulation"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["periodization-concepts"] = {
                "top_k": 2,
                "content_types": ["principle"],
                "priority": 2,
            }

        if "injury" in goal or "injury management" in goal or "injury analysis" in goal:
            selected["injury-analysis"] = {
                "top_k": 4,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["injury-prevention"] = {
                "top_k": 3,
                "content_types": ["principle"],
                "priority": 1,
            }
            selected["injury-management"] = {
                "top_k": 3,
                "content_types": ["recovery", "programming"],
                "priority": 1,
            }
            selected["exercise-selection"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        if "cardio" in goal or "running" in goal or "endurance" in goal:
            selected["running-cardio"] = {
                "top_k": 4,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["cardio-conditioning"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["running-injuries"] = {
                "top_k": 2,
                "content_types": ["recovery"],
                "priority": 2,
            }
            selected["recovery"] = {
                "top_k": 2,
                "content_types": ["recovery"],
                "priority": 2,
            }

        if "periodization" in goal or "deload" in goal or "recovery" in goal:
            selected["periodization-theory"] = {
                "top_k": 4,
                "content_types": ["principle"],
                "priority": 1,
            }
            selected["periodization-concepts"] = {
                "top_k": 3,
                "content_types": ["principle"],
                "priority": 1,
            }
            selected["fatigue-management"] = {
                "top_k": 3,
                "content_types": ["programming", "recovery"],
                "priority": 1,
            }
            selected["recovery-and-performance"] = {
                "top_k": 3,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["recovery-protocols"] = {
                "top_k": 2,
                "content_types": ["recovery"],
                "priority": 2,
            }

        # Context hints for specialized analysis
        context_hint = questionnaire.get("_context_hint", "")

        if context_hint == "high_volume_overreaching":
            selected["fatigue-management"] = {
                "top_k": 4,
                "content_types": ["programming", "recovery"],
                "priority": 1,
            }
            selected["recovery-and-performance"] = {
                "top_k": 3,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["autoregulation"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        if context_hint == "performance_plateau":
            selected["sticking-points"] = {
                "top_k": 4,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["autoregulation"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["periodization-concepts"] = {
                "top_k": 2,
                "content_types": ["principle"],
                "priority": 2,
            }

        if context_hint == "overreaching_risk":
            selected["fatigue-management"] = {
                "top_k": 3,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["recovery-and-performance"] = {
                "top_k": 3,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["injury-prevention"] = {
                "top_k": 2,
                "content_types": ["principle"],
                "priority": 2,
            }

        # Experience-based selection
        if "beginner" in experience:
            selected["beginner-fundamentals"] = {
                "top_k": 4,
                "content_types": ["principle", "programming"],
                "priority": 1,
            }
            selected["movement-patterns"] = {
                "top_k": 2,
                "content_types": ["principle"],
                "priority": 2,
            }
            selected["adherence"] = {
                "top_k": 2,
                "content_types": ["concept"],
                "priority": 2,
            }

        if "advanced" in experience or "intermediate" in experience:
            selected["autoregulation"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["periodization-concepts"] = {
                "top_k": 2,
                "content_types": ["principle"],
                "priority": 2,
            }
            selected["fatigue-management"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        # Injury-based selection
        if injuries and len(injuries) > 0:
            selected["injury-management"] = {
                "top_k": 4,
                "content_types": ["recovery", "programming"],
                "priority": 1,
            }
            selected["injury-prevention"] = {
                "top_k": 3,
                "content_types": ["principle"],
                "priority": 1,
            }
            selected["exercise-selection"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }
            selected["equipment-substitution"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        # Weak point selection
        if weak_points and len(weak_points) > 0:
            selected["sticking-points"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }

            # Add lift-specific technique namespaces
            for weak_point in weak_points:
                if "squat" in weak_point.lower():
                    selected["squat-technique"] = {
                        "top_k": 3,
                        "content_types": ["principle", "exercise"],
                        "priority": 1,
                    }

        # Equipment-based selection
        if equipment and "bodyweight" in str(equipment).lower():
            selected["calisthenics"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["bodyweight-training"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        # Always include recovery and nutrition
        selected["recovery-and-performance"] = {
            "top_k": 3,
            "content_types": ["recovery", "principle"],
            "priority": 2,
        }
        selected["nutrition-and-supplementation"] = {
            "top_k": 2,
            "content_types": ["principle"],
            "priority": 2,
        }

        # Add programming essentials
        selected["programming"] = {
            "top_k": 3,
            "content_types": ["programming", "principle"],
            "priority": 1,
        }
        selected["programming-logic"] = {
            "top_k": 2,
            "content_types": ["programming"],
            "priority": 2,
        }
        # Sport-specific selection
        primary_sport = questionnaire.get("primary_sport", "").lower()
        print(f"DEBUG: primary_sport='{primary_sport}'")
        
        if "basketball" in primary_sport:
            selected["sports-performance"] = {
                "top_k": 4,
                "content_types": ["programming", "principle"],
                "priority": 1,
            }
            selected["plyometrics"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["cardio-conditioning"] = {
                "top_k": 2,
                "content_types": ["programming"],
                "priority": 2,
            }

        if "running" in primary_sport or "marathon" in primary_sport:
            selected["running-cardio"] = {
                "top_k": 4,
                "content_types": ["programming"],
                "priority": 1,
            }
            selected["running-injuries"] = {
                "top_k": 3,
                "content_types": ["recovery"],
                "priority": 1,
            }
            selected["endurance-training"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 1,
            }

        if "football" in primary_sport or "soccer" in primary_sport:
             selected["sports-performance"] = {
                "top_k": 4,
                "content_types": ["programming"],
                "priority": 1,
            }
             selected["cardio-conditioning"] = {
                "top_k": 3,
                "content_types": ["programming"],
                "priority": 2,
            }

        return selected

    def retrieve_knowledge(
        self, query: str, namespace_config: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Retrieve knowledge from selected namespaces using metadata filtering and optimized settings

        Args:
            query: The search query (user's questionnaire summary)
            namespace_config: Output from select_namespaces()

        Returns:
            List of retrieved chunks with metadata
        """
        all_chunks = []

        # Sort namespaces by priority
        sorted_namespaces = sorted(
            namespace_config.items(), key=lambda x: (x[1]["priority"], -x[1]["top_k"])
        )

        for namespace, config in sorted_namespaces:
            try:
                index = self.client.index(namespace)

                # Get preferred content types for post-filtering
                preferred_types = config.get("content_types", [])

                # Determine semantic weight based on namespace type
                semantic_weight = self._get_semantic_weight(namespace, query)

                # Search with optimized settings (no SQL filter - not supported in current SDK)
                results = index.search(
                    query=query,
                    limit=config["top_k"],
                    semantic_weight=semantic_weight,  # Tune hybrid search
                    input_enrichment=False,  # Faster queries (our queries are already well-formed)
                    reranking=False,  # Use standard reranking (free)
                )

                for result in results:
                    # Extract content type from metadata
                    content_type = None
                    if hasattr(result, "metadata") and result.metadata:
                        content_type = result.metadata.get("content_type")

                    # Post-filter by content_type if specified
                    if preferred_types and content_type not in preferred_types:
                        continue  # Skip this result

                    # Get score
                    score = result.score if hasattr(result, "score") else 0.0

                    # Boost score if content type matches preference
                    if content_type in preferred_types:
                        score *= 1.1  # 10% boost for preferred content types

                    # Extract text
                    text = ""
                    if hasattr(result, "content") and result.content:
                        text = result.content.get("text", "")

                    if text:
                        all_chunks.append(
                            {
                                "text": text,
                                "namespace": namespace,
                                "score": score,
                                "content_type": content_type,
                                "metadata": result.metadata
                                if hasattr(result, "metadata")
                                else {},
                                "priority": config["priority"],
                                "semantic_weight": semantic_weight,
                            }
                        )

            except Exception as e:
                print(f"⚠️  Error retrieving from {namespace}: {e}")
                continue

        # Sort by score (descending) and return
        all_chunks.sort(key=lambda x: x["score"], reverse=True)

        return all_chunks

    def _get_semantic_weight(self, namespace: str, query: str) -> float:
        """
        Determine optimal semantic weight based on namespace and query type

        Higher semantic weight (0.8-0.9): Better for conceptual searches
        Lower semantic weight (0.5-0.6): Better for exact keyword matching
        Default (0.75): Balanced approach

        Args:
            namespace: The namespace being queried
            query: The search query

        Returns:
            Semantic weight between 0.0 and 1.0
        """
        # High semantic weight for conceptual/theory namespaces
        conceptual_keywords = [
            "periodization",
            "theory",
            "principle",
            "concept",
            "programming-logic",
            "adherence",
            "mindset",
        ]
        if any(keyword in namespace for keyword in conceptual_keywords):
            return 0.9  # 90% semantic for concepts

        # Lower semantic weight for exercise-specific namespaces
        exercise_keywords = [
            "technique",
            "exercise",
            "movement",
            "squat",
            "bench",
            "deadlift",
            "overhead",
        ]
        if any(keyword in namespace for keyword in exercise_keywords):
            return 0.6  # 60% semantic, 40% keyword for exercises

        # Medium-high for programming namespaces
        programming_keywords = ["programming", "template", "structure"]
        if any(keyword in namespace for keyword in programming_keywords):
            return 0.8  # 80% semantic for programming

        # Default balanced approach
        return 0.75

    def get_rag_context(
        self, questionnaire: Dict[str, Any], max_chunks: int = 50
    ) -> str:
        """
        Get RAG context for program generation

        Args:
            questionnaire: User's questionnaire responses
            max_chunks: Maximum number of chunks to include

        Returns:
            Formatted context string for LLM
        """
        # Build search query from questionnaire
        query_parts = []
        if questionnaire.get("primary_goal"):
            query_parts.append(questionnaire["primary_goal"])
        if questionnaire.get("experience_level"):
            query_parts.append(questionnaire["experience_level"])
        if questionnaire.get("training_split"):
            query_parts.append(questionnaire["training_split"])

        query = " ".join(query_parts)

        # Select namespaces
        namespace_config = self.select_namespaces(questionnaire)

        # Retrieve knowledge
        chunks = self.retrieve_knowledge(query, namespace_config)

        # Limit to max_chunks
        chunks = chunks[:max_chunks]

        # Format context
        context_parts = []
        context_parts.append("# VoiceFit Knowledge Base Context\n")
        context_parts.append(
            f"Retrieved {len(chunks)} knowledge chunks from {len(set(c['namespace'] for c in chunks))} specialized namespaces.\n"
        )

        for i, chunk in enumerate(chunks, 1):
            context_parts.append(
                f"\n## Chunk {i} [{chunk['namespace']}] (score: {chunk['score']:.2f}, type: {chunk['content_type']})"
            )
            context_parts.append(chunk["text"])

        return "\n".join(context_parts)


if __name__ == "__main__":
    # Test the selector
    selector = SmartNamespaceSelector()

    # Example questionnaire
    test_questionnaire = {
        "primary_goal": "strength and powerlifting",
        "experience_level": "intermediate",
        "training_split": "upper/lower",
        "injuries": ["lower back"],
        "weak_points": ["squat lockout"],
        "available_equipment": ["barbell", "rack", "bench"],
    }

    print("Testing Smart Namespace Selector")
    print("=" * 80)

    # Select namespaces
    namespaces = selector.select_namespaces(test_questionnaire)

    print(f"\nSelected {len(namespaces)} namespaces:")
    for ns, config in sorted(namespaces.items(), key=lambda x: x[1]["priority"]):
        print(
            f"  [{config['priority']}] {ns}: {config['top_k']} chunks, types: {config['content_types']}"
        )

    # Get RAG context
    print("\n" + "=" * 80)
    print("Retrieving knowledge...")
    context = selector.get_rag_context(test_questionnaire, max_chunks=40)

    print(f"\nContext length: {len(context)} characters")
    print("\nFirst 500 characters:")
    print(context[:500])
