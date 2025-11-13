"""
AI Coach Service with RAG (Retrieval-Augmented Generation)

This service handles AI Coach queries using:
1. Smart namespace selection (classify query to relevant knowledge areas)
2. Parallel Upstash Search (retrieve relevant context from knowledge base)
3. Streaming Grok 4 Fast Reasoning responses (with RAG context)

Optimizations:
- Streaming: Reduces perceived latency
- Parallel searches: Faster retrieval across multiple namespaces
- Smart selection: Only search relevant namespaces (1-3 instead of all)
- Grok 4 Fast: Better quality and faster than Kimi for reasoning tasks
"""

import os
import time
import json
import requests
from typing import List, Dict, Any, Tuple, Optional
from upstash_search import Search
import concurrent.futures
from dotenv import load_dotenv

load_dotenv()

# Configuration
UPSTASH_SEARCH_URL = os.getenv("UPSTASH_SEARCH_REST_URL")
UPSTASH_SEARCH_TOKEN = os.getenv("UPSTASH_SEARCH_REST_TOKEN")
XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_BASE_URL = "https://api.x.ai/v1"
GROK_MODEL_ID = "grok-4-fast-reasoning"

# Namespace categories for smart selection
NAMESPACE_CATEGORIES = {
    "injury": ["injury-analysis", "injury-prevention", "injury-management"],
    "technique": ["squat-technique", "mobility-flexibility"],
    "hypertrophy": ["hypertrophy", "strength-and-hypertrophy"],
    "strength": ["strength-training", "powerlifting-programs"],
    "programming": ["programming", "periodization", "autoregulation"],
    "nutrition": ["nutrition", "nutrition-and-supplementation"],
    "recovery": ["recovery", "fatigue-management", "recovery-and-performance"],
    "beginner": ["beginner-fundamentals", "training-fundamentals"],
    "cardio": ["running-cardio", "cardio-conditioning"],
    "plateau": ["sticking-points", "strength-training"],
    "substitution": ["exercise-substitution"],
}


class AICoachService:
    """AI Coach service with RAG capabilities"""

    def __init__(self):
        """Initialize AI Coach service"""
        self.upstash_url = UPSTASH_SEARCH_URL
        self.upstash_token = UPSTASH_SEARCH_TOKEN
        self.xai_api_key = XAI_API_KEY
        self.xai_base_url = XAI_BASE_URL
        self.model_id = GROK_MODEL_ID

        if not all([self.upstash_url, self.upstash_token, self.xai_api_key, self.model_id]):
            raise ValueError("Missing required environment variables for AI Coach service")
    
    def classify_query_to_namespaces(self, query: str) -> List[str]:
        """
        Smart namespace selection based on query keywords.
        Returns 1-3 most relevant namespaces instead of searching all.
        """
        query_lower = query.lower()
        
        # Injury detection (highest priority)
        injury_keywords = ["hurt", "pain", "injury", "sore", "ache", "strain", "tear"]
        if any(keyword in query_lower for keyword in injury_keywords):
            return NAMESPACE_CATEGORIES["injury"][:2]
        
        # Technique/form
        technique_keywords = ["form", "technique", "depth", "mobility", "flexibility", "range of motion"]
        if any(keyword in query_lower for keyword in technique_keywords):
            return NAMESPACE_CATEGORIES["technique"]
        
        # Beginner
        if "beginner" in query_lower or "start" in query_lower:
            return NAMESPACE_CATEGORIES["beginner"]
        
        # Nutrition
        nutrition_keywords = ["protein", "calories", "diet", "nutrition", "eat", "food"]
        if any(keyword in query_lower for keyword in nutrition_keywords):
            return NAMESPACE_CATEGORIES["nutrition"]
        
        # Recovery/deload
        recovery_keywords = ["deload", "recovery", "rest", "fatigue", "tired", "overtraining"]
        if any(keyword in query_lower for keyword in recovery_keywords):
            return NAMESPACE_CATEGORIES["recovery"]
        
        # Cardio/running
        cardio_keywords = ["run", "marathon", "cardio", "conditioning", "endurance"]
        if any(keyword in query_lower for keyword in cardio_keywords):
            return NAMESPACE_CATEGORIES["cardio"]
        
        # Exercise substitution
        if "alternative" in query_lower or "substitute" in query_lower or "replace" in query_lower:
            return NAMESPACE_CATEGORIES["substitution"]
        
        # Plateau/sticking points
        plateau_keywords = ["stuck", "plateau", "stall", "not progressing"]
        if any(keyword in query_lower for keyword in plateau_keywords):
            return NAMESPACE_CATEGORIES["plateau"]
        
        # Hypertrophy/muscle building
        hypertrophy_keywords = ["bigger", "muscle", "hypertrophy", "size", "mass", "grow"]
        if any(keyword in query_lower for keyword in hypertrophy_keywords):
            return NAMESPACE_CATEGORIES["hypertrophy"]
        
        # Strength
        strength_keywords = ["stronger", "strength", "powerlifting", "1rm", "max"]
        if any(keyword in query_lower for keyword in strength_keywords):
            return NAMESPACE_CATEGORIES["strength"]
        
        # Default to programming + hypertrophy (most common)
        return NAMESPACE_CATEGORIES["programming"][:1] + NAMESPACE_CATEGORIES["hypertrophy"][:1]
    
    def search_single_namespace(self, namespace: str, query: str, top_k: int) -> List[Dict]:
        """Search a single namespace (for parallel execution)."""
        try:
            client = Search(url=self.upstash_url, token=self.upstash_token)
            index = client.index(namespace)
            results = index.search(query=query, limit=top_k)
            
            namespace_results = []
            for result in results:
                if result.content and result.content.get('text'):
                    namespace_results.append({
                        'text': result.content['text'],
                        'score': result.score,
                        'namespace': namespace
                    })
            return namespace_results
        except Exception as e:
            print(f"Error searching namespace {namespace}: {e}")
            return []
    
    def retrieve_context_parallel(self, query: str, namespaces: List[str], top_k: int = 3) -> Tuple[List[str], List[str], float]:
        """
        Retrieve context from Upstash Search using PARALLEL searches.
        
        Returns:
            - List of context strings
            - List of source namespaces
            - Retrieval latency in ms
        """
        start_time = time.time()
        
        # Execute all namespace searches in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(namespaces)) as executor:
            futures = [
                executor.submit(self.search_single_namespace, ns, query, top_k)
                for ns in namespaces
            ]
            all_results = []
            for future in concurrent.futures.as_completed(futures):
                all_results.extend(future.result())
        
        latency = (time.time() - start_time) * 1000
        
        # Sort by score and take top results
        all_results.sort(key=lambda x: x['score'], reverse=True)
        top_results = all_results[:top_k]
        
        # Format context strings and track sources
        context_strings = []
        sources = []
        for i, result in enumerate(top_results, 1):
            context_strings.append(f"[Context {i} from {result['namespace']}]:\n{result['text'][:500]}...")
            if result['namespace'] not in sources:
                sources.append(result['namespace'])
        
        return context_strings, sources, latency
    
    def call_grok_streaming(
        self,
        query: str,
        context: List[str],
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[str] = None
    ) -> Tuple[str, float, float]:
        """
        Call Grok 4 Fast Reasoning model with STREAMING enabled.

        Args:
            query: User's question
            context: Knowledge base context from Upstash Search
            conversation_history: Previous conversation messages
            user_context: User's training data, injuries, PRs, etc.

        Returns:
            - Full response text
            - Time to first token (ms)
            - Total inference time (ms)
        """
        # Build system prompt with user context first (most important)
        system_prompt = """You are an expert fitness coach for VoiceFit with deep knowledge of strength training, hypertrophy, recovery, nutrition, and programming. You have a friendly, encouraging personality and provide evidence-based, practical advice.

"""

        # Inject user context if available
        if user_context:
            system_prompt += f"\n{user_context}\n\n"

        # Add knowledge base context
        system_prompt += "Use the following context from the knowledge base to inform your answer:\n\n"

        for ctx in context:
            system_prompt += f"\n{ctx}\n"

        system_prompt += "\n\nProvide a concise, actionable answer based on the user's context and knowledge base above."

        # Build messages with conversation history
        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": query})

        # Prepare request
        url = f"{self.xai_base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.xai_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500,
            "stream": True  # ENABLE STREAMING
        }

        start_time = time.time()
        response = requests.post(url, headers=headers, json=payload, stream=True)

        if response.status_code != 200:
            raise Exception(f"Grok API error: {response.status_code} - {response.text}")
        
        # Process streaming response
        full_response = ""
        time_to_first_token = None
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]  # Remove 'data: ' prefix
                    
                    if data_str == '[DONE]':
                        break
                    
                    try:
                        data = json.loads(data_str)
                        if 'choices' in data and len(data['choices']) > 0:
                            delta = data['choices'][0].get('delta', {})
                            content = delta.get('content', '')
                            
                            if content:
                                if time_to_first_token is None:
                                    time_to_first_token = (time.time() - start_time) * 1000
                                full_response += content
                    except json.JSONDecodeError:
                        continue
        
        total_time = (time.time() - start_time) * 1000
        
        return full_response, time_to_first_token or 0, total_time
    
    def ask(
        self,
        question: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main method to ask AI Coach a question.

        Args:
            question: User's question
            conversation_history: Previous conversation messages
            user_context: User's training data, injuries, PRs, etc. from UserContextBuilder

        Returns:
            - answer: AI Coach response
            - confidence: Confidence score
            - sources: Knowledge base sources used
            - latency_ms: Total latency
            - perceived_latency_ms: Perceived latency (retrieval + TTFT)
        """
        total_start = time.time()

        # Step 1: Smart namespace selection
        namespaces = self.classify_query_to_namespaces(question)

        # Step 2: Parallel retrieval from Upstash
        context, sources, retrieval_latency = self.retrieve_context_parallel(question, namespaces, top_k=3)

        # Step 3: Streaming Grok response with user context
        answer, ttft, inference_latency = self.call_grok_streaming(question, context, conversation_history, user_context)
        
        # Calculate metrics
        total_latency = (time.time() - total_start) * 1000
        perceived_latency = retrieval_latency + ttft
        
        # Calculate confidence based on context quality
        # Higher confidence if we found good context
        confidence = min(0.95, 0.70 + (len(context) * 0.08))
        
        return {
            "answer": answer,
            "confidence": confidence,
            "sources": sources,
            "latency_ms": int(total_latency),
            "perceived_latency_ms": int(perceived_latency),
            "retrieval_latency_ms": int(retrieval_latency),
            "inference_latency_ms": int(inference_latency),
            "time_to_first_token_ms": int(ttft)
        }

