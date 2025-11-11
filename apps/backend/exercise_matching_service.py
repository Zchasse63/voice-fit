"""
Exercise Matching and Creation Service

This service handles:
1. Fuzzy matching of exercise names to existing database exercises
2. Semantic search using embeddings for similar exercises
3. Automatic creation of new exercises when no match is found
4. Proper schema population with all required fields
"""

import os
import re
import uuid
from typing import Optional, Dict, Any, List, Tuple
from openai import OpenAI
from supabase import create_client, Client
from difflib import SequenceMatcher


class ExerciseMatchingService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.openai_client = OpenAI(api_key=self.openai_api_key)
        
        # Cache of exercises loaded from database
        self.exercise_cache: Dict[str, Dict[str, Any]] = {}
        self.load_exercise_cache()
    
    def load_exercise_cache(self):
        """Load all exercises from database into memory for fast matching"""
        try:
            response = self.supabase.table('exercises').select(
                'id, original_name, normalized_name, synonyms, base_movement, '
                'movement_pattern, primary_equipment, category'
            ).execute()
            
            for exercise in response.data:
                # Index by original name
                self.exercise_cache[exercise['original_name'].lower()] = exercise
                
                # Index by normalized name
                if exercise.get('normalized_name'):
                    self.exercise_cache[exercise['normalized_name'].lower()] = exercise
                
                # Index by synonyms
                if exercise.get('synonyms'):
                    for synonym in exercise['synonyms']:
                        self.exercise_cache[synonym.lower()] = exercise
            
            print(f"✅ Loaded {len(response.data)} exercises into cache")
        except Exception as e:
            print(f"❌ Error loading exercise cache: {e}")
    
    def normalize_name(self, name: str) -> str:
        """Normalize exercise name for matching"""
        # Remove special characters, convert to lowercase
        normalized = re.sub(r'[^a-z0-9\s]', '', name.lower())
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        return normalized
    
    def fuzzy_match_score(self, name1: str, name2: str) -> float:
        """Calculate fuzzy match score between two names (0-1)"""
        return SequenceMatcher(None, name1.lower(), name2.lower()).ratio()
    
    def find_exercise_exact(self, exercise_name: str) -> Optional[str]:
        """Try to find exact match in cache"""
        normalized = self.normalize_name(exercise_name)
        
        # Try exact match
        if normalized in self.exercise_cache:
            return self.exercise_cache[normalized]['id']
        
        # Try original name match
        if exercise_name.lower() in self.exercise_cache:
            return self.exercise_cache[exercise_name.lower()]['id']
        
        return None
    
    def find_exercise_fuzzy(self, exercise_name: str, threshold: float = 0.80) -> Optional[Tuple[str, float, str]]:
        """Find best fuzzy match above threshold"""
        normalized = self.normalize_name(exercise_name)
        best_match = None
        best_score = 0.0
        best_match_name = None

        for cached_name, exercise in self.exercise_cache.items():
            score = self.fuzzy_match_score(normalized, cached_name)
            if score > best_score and score >= threshold:
                best_score = score
                best_match = exercise['id']
                best_match_name = exercise['original_name']

        if best_match:
            return (best_match, best_score, best_match_name)
        return None
    
    def find_exercise_semantic(self, exercise_name: str, threshold: float = 0.90) -> Optional[Tuple[str, float]]:
        """Find exercise using semantic similarity (embeddings)"""
        try:
            # Generate embedding for the exercise name
            embedding_response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=exercise_name
            )
            query_embedding = embedding_response.data[0].embedding
            
            # Query database for similar exercises using vector similarity
            # Note: This requires pgvector extension and proper indexing
            response = self.supabase.rpc(
                'match_exercises',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': threshold,
                    'match_count': 1
                }
            ).execute()
            
            if response.data and len(response.data) > 0:
                match = response.data[0]
                return (match['id'], match['similarity'])
            
        except Exception as e:
            print(f"  ⚠️  Semantic search failed: {e}")
        
        return None
    
    def parse_exercise_components(self, exercise_name: str) -> Dict[str, Any]:
        """Parse exercise name to extract components for creation"""
        name_lower = exercise_name.lower()
        
        # Detect equipment
        equipment_map = {
            'barbell': ['barbell', 'bar ', 'bb '],
            'dumbbell': ['dumbbell', 'db ', 'dumbell'],
            'cable': ['cable'],
            'machine': ['machine'],
            'bodyweight': ['bodyweight', 'bw '],
            'kettlebell': ['kettlebell', 'kb '],
            'resistance_band': ['band'],
            'smith_machine': ['smith']
        }
        
        primary_equipment = 'other'
        for equipment, keywords in equipment_map.items():
            if any(kw in name_lower for kw in keywords):
                primary_equipment = equipment
                break
        
        # Detect movement pattern
        # Valid: horizontal_push, horizontal_pull, vertical_push, vertical_pull, squat, hinge,
        #        lunge, core, isolation_upper, isolation_lower, carry, plyometric, mobility, olympic, cardio
        movement_patterns = {
            'horizontal_push': ['bench', 'push up', 'pushup', 'chest press', 'flat press', 'incline press', 'decline press'],
            'vertical_push': ['overhead press', 'shoulder press', 'military press', 'ohp'],
            'horizontal_pull': ['row'],
            'vertical_pull': ['pulldown', 'pull down', 'chin up', 'pull up', 'pullup', 'lat pull'],
            'squat': ['squat'],
            'hinge': ['deadlift', 'rdl', 'romanian', 'good morning'],
            'lunge': ['lunge', 'split squat', 'step up'],
            'core': ['crunch', 'plank', 'ab ', 'abs ', 'core'],
            'isolation_upper': ['curl', 'extension', 'raise', 'fly', 'flye', 'lateral', 'delt'],
            'isolation_lower': ['leg curl', 'leg extension', 'calf'],
            'carry': ['carry', 'farmer'],
            'plyometric': ['sled', 'sprint', 'jump', 'box', 'push interval'],
            'cardio': ['run', 'bike', 'row machine', 'elliptical']
        }

        movement_pattern = None  # NULL is allowed by database
        for pattern, keywords in movement_patterns.items():
            if any(kw in name_lower for kw in keywords):
                movement_pattern = pattern
                break
        
        # Detect force type
        force = 'push' if any(kw in name_lower for kw in ['press', 'push', 'squat']) else 'pull'
        
        # Detect mechanic
        compound_keywords = ['press', 'squat', 'deadlift', 'row', 'pull up', 'chin up']
        mechanic = 'compound' if any(kw in name_lower for kw in compound_keywords) else 'isolation'
        
        # Detect level
        advanced_keywords = ['cluster', 'pause', 'tempo', 'speed', 'deficit']
        level = 'advanced' if any(kw in name_lower for kw in advanced_keywords) else 'intermediate'
        
        return {
            'primary_equipment': primary_equipment,
            'movement_pattern': movement_pattern,
            'force': force,
            'mechanic': mechanic,
            'level': level
        }
    
    def generate_exercise_embedding(self, exercise_name: str) -> List[float]:
        """Generate embedding for exercise name (384 dimensions to match database)"""
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=exercise_name,
                dimensions=384  # Match database schema
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"  ⚠️  Failed to generate embedding: {e}")
            return []
    
    def generate_phonetic_key(self, text: str) -> str:
        """Generate a simple phonetic key for the exercise name"""
        # Simple phonetic algorithm: keep consonants, remove vowels
        text = text.upper()
        # Remove special characters and numbers
        text = re.sub(r'[^A-Z\s]', '', text)
        # Remove vowels (except at start of words)
        words = text.split()
        phonetic_parts = []
        for word in words:
            if len(word) > 0:
                # Keep first letter, then remove vowels
                phonetic = word[0] + re.sub(r'[AEIOU]', '', word[1:])
                phonetic_parts.append(phonetic)
        return ''.join(phonetic_parts)[:20]  # Limit length

    def create_exercise(self, exercise_name: str) -> Optional[str]:
        """Create a new exercise in the database with full schema"""
        print(f"  🆕 Creating new exercise: {exercise_name}")

        # Parse components
        components = self.parse_exercise_components(exercise_name)

        # Generate embedding
        embedding = self.generate_exercise_embedding(exercise_name)

        # Normalize name
        normalized_name = re.sub(r'[^a-z0-9]', '', exercise_name.lower())

        # Generate base movement (simplified name)
        base_movement = re.sub(r'\(.*?\)', '', exercise_name).strip()

        # Generate phonetic key
        phonetic_key = self.generate_phonetic_key(exercise_name)

        # Create exercise data
        exercise_data = {
            'id': str(uuid.uuid4()),
            'original_name': exercise_name,
            'normalized_name': normalized_name,
            'phonetic_key': phonetic_key,
            'base_movement': base_movement,
            'embedding': embedding if embedding else None,
            'movement_pattern': components['movement_pattern'],
            'force': components['force'],
            'level': components['level'],
            'mechanic': components['mechanic'],
            'primary_equipment': components['primary_equipment'],
            'category': 'strength',
            'synonyms': [],
            'equipment_secondary': [],
            'form_cues': [],
            'common_modifiers': [],
            'training_modality': ['strength', 'hypertrophy'],
            'variations': [],
            'common_mistakes': [],
            'notes': f"{exercise_name} - Auto-generated exercise",
            'voice_priority': 50  # Lower priority for auto-generated
        }
        
        try:
            response = self.supabase.table('exercises').insert(exercise_data).execute()
            exercise_id = exercise_data['id']
            
            # Add to cache
            self.exercise_cache[exercise_name.lower()] = exercise_data
            self.exercise_cache[normalized_name] = exercise_data
            
            print(f"  ✅ Created exercise: {exercise_name} (ID: {exercise_id})")
            return exercise_id
        except Exception as e:
            print(f"  ❌ Error creating exercise: {e}")
            return None
    
    def match_or_create_exercise(self, exercise_name: str, auto_create: bool = True) -> Optional[str]:
        """
        Main method: Try to match exercise, optionally create if not found

        Args:
            exercise_name: Name of the exercise to match
            auto_create: If True, create exercise if no match found. If False, return None.

        Returns exercise ID or None if failed
        """
        # Step 1: Try exact match
        exercise_id = self.find_exercise_exact(exercise_name)
        if exercise_id:
            return exercise_id

        # Step 2: Try fuzzy match (80% similarity - lower threshold for better matching)
        fuzzy_result = self.find_exercise_fuzzy(exercise_name, threshold=0.80)
        if fuzzy_result:
            exercise_id, score, matched_name = fuzzy_result
            print(f"  🔍 Matched '{exercise_name}' → '{matched_name}' (score: {score:.2f})")
            return exercise_id

        # Step 3: Try semantic search (if available)
        # semantic_result = self.find_exercise_semantic(exercise_name, threshold=0.90)
        # if semantic_result:
        #     exercise_id, score = semantic_result
        #     print(f"  🧠 Semantic matched '{exercise_name}' (score: {score:.2f})")
        #     return exercise_id

        # Step 4: Create new exercise (if enabled)
        if auto_create:
            return self.create_exercise(exercise_name)
        else:
            print(f"  ⚠️  No match found for '{exercise_name}' (auto-create disabled)")
            return None

