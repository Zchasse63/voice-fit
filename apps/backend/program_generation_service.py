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

import os
import time
import json
from typing import List, Dict, Any, Tuple, Optional
from openai import OpenAI
from dotenv import load_dotenv
import sys

# Add parent directory to path to import smart_namespace_selector
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from smart_namespace_selector import SmartNamespaceSelector

load_dotenv()


class ProgramGenerationService:
    """Service for generating AI-powered custom training programs"""

    def __init__(self):
        """Initialize the program generation service"""
        # Initialize Smart Namespace Selector (handles Upstash internally)
        self.selector = SmartNamespaceSelector()

        # xAI (Grok) credentials for program generation
        self.xai_api_key = os.getenv("XAI_API_KEY")
        if not self.xai_api_key:
            raise ValueError("Missing xAI API key")

        # Initialize Grok client (uses OpenAI-compatible API)
        self.grok_client = OpenAI(
            api_key=self.xai_api_key,
            base_url="https://api.x.ai/v1"
        )

        # Model configuration
        self.model_name = "grok-4-fast-reasoning"
        
        # RAG configuration
        self.max_chunks = 50  # Maximum knowledge chunks to retrieve
    
    def generate_program(
        self,
        questionnaire: Dict[str, Any],
        user_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete 12-week training program using Grok 4 Fast

        Args:
            questionnaire: User's training questionnaire data
            user_context: User's training history, PRs, injuries, etc. from UserContextBuilder

        Returns:
            Dict containing:
            - program: Complete 12-week program JSON
            - cost: Generation cost breakdown
            - stats: RAG retrieval statistics
            - generation_time: Time taken to generate
        """
        start_time = time.time()

        # Step 1: Retrieve knowledge using Smart Namespace Selector
        retrieval_start = time.time()
        rag_context = self.selector.get_rag_context(questionnaire, max_chunks=self.max_chunks)
        retrieval_time = time.time() - retrieval_start

        # Get retrieval stats
        namespace_config = self.selector.select_namespaces(questionnaire)
        stats = {
            "namespaces_selected": len(namespace_config),
            "context_length": len(rag_context),
            "estimated_tokens": len(rag_context) // 4,
            "retrieval_time_seconds": retrieval_time
        }

        # Step 2: Build prompt with user context
        prompt = self._build_program_prompt(questionnaire, rag_context, user_context)

        # Step 3: Call Grok 4 Fast
        generation_start = time.time()
        response = self.grok_client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": self._get_system_message()},
                {"role": "user", "content": prompt}
            ],
            max_tokens=30000,  # Increased for complete 12-week programs
            temperature=0.7
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
            with open('grok_error_response.txt', 'w') as f:
                f.write(program_json)
            raise ValueError(f"Failed to parse JSON response: {e}. Raw response saved to grok_error_response.txt")

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
                "total_cost": total_cost
            },
            "stats": stats,
            "generation_time_seconds": total_time,
            "retrieval_time_seconds": retrieval_time,
            "model_generation_time_seconds": generation_time
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
    
    def _build_program_prompt(self, questionnaire: Dict[str, Any], knowledge_context: str, user_context: Optional[str] = None) -> str:
        """Build the complete program generation prompt with user context"""
        # Build prompt
        prompt = f"""Generate a complete 12-week training program for this athlete:

QUESTIONNAIRE:
{json.dumps(questionnaire, indent=2)}
"""

        # Inject user context if available
        if user_context:
            prompt += f"\nUSER CONTEXT:\n{user_context}\n"

        prompt += f"""
KNOWLEDGE BASE CONTEXT:
{knowledge_context}

Generate the complete 12-week program in JSON format."""

        return prompt

