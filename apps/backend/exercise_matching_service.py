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
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI

from supabase import Client, create_client


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
            response = (
                self.supabase.table("exercises")
                .select(
                    "id, original_name, normalized_name, synonyms, base_movement, "
                    "movement_pattern, primary_equipment, category"
                )
                .execute()
            )

            for exercise in response.data:
                # Index by original name
                self.exercise_cache[exercise["original_name"].lower()] = exercise

                # Index by normalized name
                if exercise.get("normalized_name"):
                    self.exercise_cache[exercise["normalized_name"].lower()] = exercise

                # Index by synonyms
                if exercise.get("synonyms"):
                    for synonym in exercise["synonyms"]:
                        self.exercise_cache[synonym.lower()] = exercise

            print(f"✅ Loaded {len(response.data)} exercises into cache")
        except Exception as e:
            print(f"❌ Error loading exercise cache: {e}")

    def normalize_name(self, name: str) -> str:
        """Normalize exercise name for matching"""
        # Remove special characters, convert to lowercase
        normalized = re.sub(r"[^a-z0-9\s]", "", name.lower())
        # Remove extra whitespace
        normalized = " ".join(normalized.split())
        return normalized

    def generate_synonyms(self, exercise_name: str) -> List[str]:
        """Generate comprehensive synonyms for an exercise name"""
        name_lower = exercise_name.lower()
        synonyms = []

        # Comprehensive substitutions dictionary
        substitutions = {
            # Equipment variations
            "dumbbell": ["db", "dumbell", "dumbel", "dumb bell"],
            "barbell": ["bb", "bar", "bar bell"],
            "kettlebell": ["kb", "kettle bell"],
            "cable": ["machine", "pulley"],
            "smith machine": ["smith", "machine"],
            "trap bar": ["hex bar", "trapbar"],
            "ez bar": ["ez-bar", "ezbar", "easy bar"],
            "resistance band": ["band", "bands"],
            # Unilateral variations
            "single arm": ["one arm", "unilateral", "1 arm", "single-arm", "one-arm"],
            "single leg": ["one leg", "unilateral", "1 leg", "single-leg", "one-leg"],
            "double arm": ["two arm", "bilateral", "2 arm", "double-arm", "two-arm"],
            "double leg": ["two leg", "bilateral", "2 leg", "double-leg", "two-leg"],
            # Movement variations
            "press": ["push", "pressing"],
            "pull up": ["pullup", "chin up", "chinup", "pull-up", "chin-up"],
            "push up": ["pushup", "press up", "push-up", "pressup"],
            "sit up": ["situp", "sit-up", "crunch"],
            "squat": ["squats", "squatting"],
            "lunge": ["lunges", "lunging"],
            "deadlift": ["dead lift", "dl"],
            "row": ["rows", "rowing"],
            "curl": ["curls", "curling"],
            "extension": ["extensions"],
            "raise": ["raises", "raising"],
            "fly": ["flye", "flies", "flyes"],
            # Specific exercises
            "leg curl": ["hamstring curl", "ham curl", "lying leg curl"],
            "leg extension": ["quad extension", "knee extension"],
            "calf raise": ["calf raises", "heel raise", "heel raises"],
            "front squat": ["front squats"],
            "back squat": ["back squats", "squat", "squats"],
            "romanian deadlift": [
                "rdl",
                "stiff leg deadlift",
                "stiff-leg deadlift",
                "sldl",
            ],
            "lateral raise": [
                "side raise",
                "lateral raises",
                "side raises",
                "side delt raise",
            ],
            "bent over row": ["bent-over row", "barbell row", "bent row"],
            "overhead press": ["ohp", "military press", "shoulder press"],
            "bench press": ["bench", "flat bench", "barbell bench"],
            "incline press": ["incline bench", "incline bench press"],
            "decline press": ["decline bench", "decline bench press"],
            "lat pulldown": ["lat pull down", "lat pull-down", "pulldown"],
            "tricep extension": ["triceps extension", "tri extension"],
            "bicep curl": ["biceps curl", "bi curl"],
            "chest fly": ["chest flye", "pec fly", "pec flye"],
            "face pull": ["facepull", "face-pull"],
            "good morning": ["good mornings"],
            "glute bridge": ["hip bridge", "glute bridges", "hip bridges"],
            "hip thrust": ["hip thrusts", "barbell hip thrust"],
            # Grip/stance variations
            "close grip": ["close-grip", "narrow grip", "narrow-grip"],
            "wide grip": ["wide-grip"],
            "neutral grip": ["neutral-grip"],
            "overhand": ["pronated"],
            "underhand": ["supinated"],
            "sumo": ["wide stance"],
            # Position variations
            "standing": [],
            "seated": [],
            "lying": ["laying"],
            "kneeling": [],
            "incline": ["inclined"],
            "decline": ["declined"],
        }

        # Generate variations
        for term, replacements in substitutions.items():
            if term in name_lower:
                for replacement in replacements:
                    synonym = name_lower.replace(term, replacement)
                    if synonym != name_lower:
                        synonyms.append(synonym)

        # Add original in different formats
        synonyms.append(name_lower)
        synonyms.append(self.normalize_name(exercise_name))

        # Add variations with/without hyphens
        if "-" in name_lower:
            synonyms.append(name_lower.replace("-", " "))
        if " " in name_lower:
            synonyms.append(name_lower.replace(" ", "-"))

        # Remove duplicates and return
        return list(set(synonyms))

    def generate_synonyms_llm(
        self, exercise_name: str, max_synonyms: int = 10
    ) -> List[str]:
        """Generate synonyms using LLM for better quality and context awareness"""
        try:
            prompt = f"""Generate {max_synonyms} common synonyms and variations for this exercise: "{exercise_name}"

Include:
- Equipment variations (e.g., "dumbbell" → "db", "barbell" → "bb")
- Common abbreviations
- Alternative names used in gyms
- Singular/plural forms
- Different word orders

Return ONLY a comma-separated list of synonyms, no explanations.

Example for "Barbell Back Squat":
back squat, bb squat, barbell squat, squat, back squats, bb back squat

Synonyms for "{exercise_name}":\n"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert fitness trainer who knows all exercise name variations.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=100,
            )

            synonyms_text = response.choices[0].message.content.strip()
            synonyms = [s.strip().lower() for s in synonyms_text.split(",")]

            # Filter out empty strings and duplicates
            synonyms = [s for s in synonyms if s and len(s) > 2]

            return list(set(synonyms))[:max_synonyms]

        except Exception as e:
            print(f"  ⚠️  LLM synonym generation failed: {e}")
            # Fallback to rule-based generation
            return self.generate_synonyms(exercise_name)

    def fuzzy_match_score(self, name1: str, name2: str) -> float:
        """Calculate fuzzy match score between two names (0-1)"""
        return SequenceMatcher(None, name1.lower(), name2.lower()).ratio()

    def find_exercise_exact(self, exercise_name: str) -> Optional[str]:
        """Try to find exact match in cache"""
        normalized = self.normalize_name(exercise_name)

        # Try exact match
        if normalized in self.exercise_cache:
            return self.exercise_cache[normalized]["id"]

        # Try original name match
        if exercise_name.lower() in self.exercise_cache:
            return self.exercise_cache[exercise_name.lower()]["id"]

        return None

    def find_exercise_fuzzy(
        self, exercise_name: str, threshold: float = 0.80
    ) -> Optional[Tuple[str, float, str]]:
        """Find best fuzzy match above threshold"""
        normalized = self.normalize_name(exercise_name)
        best_match = None
        best_score = 0.0
        best_match_name = None

        for cached_name, exercise in self.exercise_cache.items():
            score = self.fuzzy_match_score(normalized, cached_name)
            if score > best_score and score >= threshold:
                best_score = score
                best_match = exercise["id"]
                best_match_name = exercise["original_name"]

        if best_match:
            return (best_match, best_score, best_match_name)
        return None

    def find_exercise_semantic(
        self, exercise_name: str, threshold: float = 0.90
    ) -> Optional[Tuple[str, float]]:
        """Find exercise using semantic similarity (embeddings)"""
        try:
            # Generate embedding for the exercise name
            embedding_response = self.openai_client.embeddings.create(
                model="text-embedding-3-small", input=exercise_name
            )
            query_embedding = embedding_response.data[0].embedding

            # Query database for similar exercises using vector similarity
            # Note: This requires pgvector extension and proper indexing
            response = self.supabase.rpc(
                "match_exercises",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": threshold,
                    "match_count": 1,
                },
            ).execute()

            if response.data and len(response.data) > 0:
                match = response.data[0]
                return (match["id"], match["similarity"])

        except Exception as e:
            print(f"  ⚠️  Semantic search failed: {e}")

        return None

    def parse_exercise_components(self, exercise_name: str) -> Dict[str, Any]:
        """Parse exercise name to extract components for creation"""
        name_lower = exercise_name.lower()

        # Detect equipment
        equipment_map = {
            "barbell": ["barbell", "bar ", "bb "],
            "dumbbell": ["dumbbell", "db ", "dumbell"],
            "cable": ["cable"],
            "machine": ["machine"],
            "bodyweight": ["bodyweight", "bw "],
            "kettlebell": ["kettlebell", "kb "],
            "resistance_band": ["band"],
            "smith_machine": ["smith"],
        }

        primary_equipment = "other"
        for equipment, keywords in equipment_map.items():
            if any(kw in name_lower for kw in keywords):
                primary_equipment = equipment
                break

        # Detect movement pattern
        # Valid: horizontal_push, horizontal_pull, vertical_push, vertical_pull, squat, hinge,
        #        lunge, core, isolation_upper, isolation_lower, carry, plyometric, mobility, olympic, cardio
        movement_patterns = {
            "horizontal_push": [
                "bench",
                "push up",
                "pushup",
                "chest press",
                "flat press",
                "incline press",
                "decline press",
            ],
            "vertical_push": [
                "overhead press",
                "shoulder press",
                "military press",
                "ohp",
            ],
            "horizontal_pull": ["row"],
            "vertical_pull": [
                "pulldown",
                "pull down",
                "chin up",
                "pull up",
                "pullup",
                "lat pull",
            ],
            "squat": ["squat"],
            "hinge": ["deadlift", "rdl", "romanian", "good morning"],
            "lunge": ["lunge", "split squat", "step up"],
            "core": ["crunch", "plank", "ab ", "abs ", "core"],
            "isolation_upper": [
                "curl",
                "extension",
                "raise",
                "fly",
                "flye",
                "lateral",
                "delt",
            ],
            "isolation_lower": ["leg curl", "leg extension", "calf"],
            "carry": ["carry", "farmer"],
            "plyometric": ["sled", "sprint", "jump", "box", "push interval"],
            "cardio": ["run", "bike", "row machine", "elliptical"],
        }

        movement_pattern = None  # NULL is allowed by database
        for pattern, keywords in movement_patterns.items():
            if any(kw in name_lower for kw in keywords):
                movement_pattern = pattern
                break

        # Detect force type
        force = (
            "push"
            if any(kw in name_lower for kw in ["press", "push", "squat"])
            else "pull"
        )

        # Detect mechanic
        compound_keywords = ["press", "squat", "deadlift", "row", "pull up", "chin up"]
        mechanic = (
            "compound"
            if any(kw in name_lower for kw in compound_keywords)
            else "isolation"
        )

        # Detect level
        advanced_keywords = ["cluster", "pause", "tempo", "speed", "deficit"]
        level = (
            "advanced"
            if any(kw in name_lower for kw in advanced_keywords)
            else "intermediate"
        )

        return {
            "primary_equipment": primary_equipment,
            "movement_pattern": movement_pattern,
            "force": force,
            "mechanic": mechanic,
            "level": level,
        }

    def generate_exercise_embedding(self, exercise_name: str) -> List[float]:
        """Generate embedding for exercise name (384 dimensions to match database)"""
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=exercise_name,
                dimensions=384,  # Match database schema
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
        text = re.sub(r"[^A-Z\s]", "", text)
        # Remove vowels (except at start of words)
        words = text.split()
        phonetic_parts = []
        for word in words:
            if len(word) > 0:
                # Keep first letter, then remove vowels
                phonetic = word[0] + re.sub(r"[AEIOU]", "", word[1:])
                phonetic_parts.append(phonetic)
        return "".join(phonetic_parts)[:20]  # Limit length

    def create_exercise(self, exercise_name: str) -> Optional[str]:
        """Create a new exercise in the database with full schema"""
        print(f"  🆕 Creating new exercise: {exercise_name}")

        # Parse components
        components = self.parse_exercise_components(exercise_name)

        # Generate embedding
        embedding = self.generate_exercise_embedding(exercise_name)

        # Normalize name
        normalized_name = re.sub(r"[^a-z0-9]", "", exercise_name.lower())

        # Generate base movement (simplified name)
        base_movement = re.sub(r"\(.*?\)", "", exercise_name).strip()

        # Generate phonetic key
        phonetic_key = self.generate_phonetic_key(exercise_name)

        # Create exercise data
        exercise_data = {
            "id": str(uuid.uuid4()),
            "original_name": exercise_name,
            "normalized_name": normalized_name,
            "phonetic_key": phonetic_key,
            "base_movement": base_movement,
            "embedding": embedding if embedding else None,
            "movement_pattern": components["movement_pattern"],
            "force": components["force"],
            "level": components["level"],
            "mechanic": components["mechanic"],
            "primary_equipment": components["primary_equipment"],
            "category": "strength",
            "synonyms": [],
            "equipment_secondary": [],
            "form_cues": [],
            "common_modifiers": [],
            "training_modality": ["strength", "hypertrophy"],
            "variations": [],
            "common_mistakes": [],
            "notes": f"{exercise_name} - Auto-generated exercise",
            "voice_priority": 50,  # Lower priority for auto-generated
        }

        try:
            response = self.supabase.table("exercises").insert(exercise_data).execute()
            exercise_id = exercise_data["id"]

            # Add to cache
            self.exercise_cache[exercise_name.lower()] = exercise_data
            self.exercise_cache[normalized_name] = exercise_data

            print(f"  ✅ Created exercise: {exercise_name} (ID: {exercise_id})")
            return exercise_id
        except Exception as e:
            print(f"  ❌ Error creating exercise: {e}")
            return None

    def match_or_create_exercise(
        self, exercise_name: str, auto_create: bool = True
    ) -> Optional[str]:
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
            print(
                f"  🔍 Matched '{exercise_name}' → '{matched_name}' (score: {score:.2f})"
            )
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

    def match_or_create_with_details(
        self,
        exercise_name: str,
        auto_create: bool = True,
        use_llm_synonyms: bool = False,
        fuzzy_threshold: float = 0.80,
    ) -> Dict[str, Any]:
        """
        Enhanced method for API endpoint: Match or create exercise with full details.

        Args:
            exercise_name: Name of the exercise to match
            auto_create: If True, create exercise if no match found
            use_llm_synonyms: Use LLM-based synonym generation
            fuzzy_threshold: Minimum fuzzy match score

        Returns:
            Dictionary with detailed match/creation information
        """
        result = {
            "success": False,
            "exercise_id": None,
            "exercise_name": exercise_name,
            "matched_name": None,
            "match_type": None,
            "match_score": None,
            "synonyms": [],
            "created": False,
            "message": "",
            "metadata": None,
        }

        # Step 1: Generate synonyms (for response and better matching)
        if use_llm_synonyms:
            result["synonyms"] = self.generate_synonyms_llm(exercise_name)
        else:
            result["synonyms"] = self.generate_synonyms(exercise_name)

        # Step 2: Try exact match
        exercise_id = self.find_exercise_exact(exercise_name)
        if exercise_id:
            result["success"] = True
            result["exercise_id"] = exercise_id
            result["match_type"] = "exact"
            result["match_score"] = 1.0
            result["message"] = f"Exact match found for '{exercise_name}'"

            # Get metadata from cache
            cached_exercise = self.exercise_cache.get(exercise_name.lower())
            if cached_exercise:
                result["metadata"] = {
                    "movement_pattern": cached_exercise.get("movement_pattern"),
                    "primary_equipment": cached_exercise.get("primary_equipment"),
                    "category": cached_exercise.get("category"),
                    "base_movement": cached_exercise.get("base_movement"),
                }

            return result

        # Step 3: Try fuzzy match
        fuzzy_result = self.find_exercise_fuzzy(
            exercise_name, threshold=fuzzy_threshold
        )
        if fuzzy_result:
            exercise_id, score, matched_name = fuzzy_result
            result["success"] = True
            result["exercise_id"] = exercise_id
            result["matched_name"] = matched_name
            result["match_type"] = "fuzzy"
            result["match_score"] = score
            result["message"] = (
                f"Matched to existing exercise: {matched_name} "
                f"({int(score * 100)}% similarity)"
            )

            # Get metadata from cache
            cached_exercise = self.exercise_cache.get(matched_name.lower())
            if cached_exercise:
                result["metadata"] = {
                    "movement_pattern": cached_exercise.get("movement_pattern"),
                    "primary_equipment": cached_exercise.get("primary_equipment"),
                    "category": cached_exercise.get("category"),
                    "base_movement": cached_exercise.get("base_movement"),
                }

            return result

        # Step 4: Try semantic search (commented out - requires DB function)
        # semantic_result = self.find_exercise_semantic(exercise_name, threshold=0.90)
        # if semantic_result:
        #     exercise_id, score = semantic_result
        #     result["success"] = True
        #     result["exercise_id"] = exercise_id
        #     result["match_type"] = "semantic"
        #     result["match_score"] = score
        #     result["message"] = f"Semantic match found ({int(score * 100)}% similarity)"
        #     return result

        # Step 5: Create new exercise (if enabled)
        if auto_create:
            exercise_id = self.create_exercise(exercise_name)
            if exercise_id:
                components = self.parse_exercise_components(exercise_name)
                result["success"] = True
                result["exercise_id"] = exercise_id
                result["match_type"] = "created"
                result["created"] = True
                result["message"] = f"Created new exercise: {exercise_name}"
                result["metadata"] = components
                return result
            else:
                result["success"] = False
                result["message"] = f"Failed to create exercise: {exercise_name}"
                return result
        else:
            result["success"] = False
            result["match_type"] = "none"
            result["message"] = (
                f"No match found for '{exercise_name}' (auto-create disabled)"
            )
            return result
