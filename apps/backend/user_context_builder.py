"""
User Context Builder for AI Prompts

This service fetches user data from Supabase and builds a comprehensive
context string to inject into AI system prompts. This ensures the AI has
full knowledge of the user's training history, injuries, recovery status,
and preferences.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from supabase import Client


class UserContextBuilder:
    """Builds comprehensive user context for AI prompts"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def build_context(self, user_id: str) -> str:
        """
        Build comprehensive user context string for AI system prompt
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            Formatted context string to inject into system prompt
        """
        # Fetch all user data in parallel
        user_profile = await self._get_user_profile(user_id)
        active_injuries = await self._get_active_injuries(user_id)
        recent_workouts = await self._get_recent_workouts(user_id, days=7)
        weekly_volume = await self._calculate_weekly_volume(user_id)
        readiness = await self._get_latest_readiness(user_id)
        current_program = await self._get_current_program(user_id)
        
        # Build context string
        context_parts = []
        
        # Header
        context_parts.append("**USER CONTEXT:**\n")
        
        # Training Profile
        if user_profile:
            context_parts.append("**Training Profile:**")
            context_parts.append(f"- Experience: {user_profile.get('experience_level', 'unknown')} ({user_profile.get('training_age', 'unknown')} training)")
            context_parts.append(f"- Tier: {user_profile.get('tier', 'free')}")
            context_parts.append(f"- Goals: {', '.join(user_profile.get('goals', []))}")
            context_parts.append(f"- Age: {user_profile.get('age', 'unknown')}")
            context_parts.append("")
        
        # Current Program
        if current_program:
            context_parts.append("**Current Program:**")
            context_parts.append(f"- Program: {current_program.get('name', 'Custom')}")
            context_parts.append(f"- Week: {current_program.get('current_week', 'unknown')} of {current_program.get('total_weeks', 'unknown')}")
            context_parts.append(f"- Focus: {current_program.get('focus', 'strength')}")
            context_parts.append("")
        
        # Weekly Volume
        if weekly_volume:
            context_parts.append("**Current Training Volume (This Week):**")
            for exercise, sets in weekly_volume.items():
                context_parts.append(f"- {exercise}: {sets} sets")
            context_parts.append("")
        
        # Recent Workouts
        if recent_workouts:
            context_parts.append("**Recent Workouts (Last 7 Days):**")
            for workout in recent_workouts[:3]:  # Show last 3 workouts
                date = workout.get('date', 'unknown')
                exercises = workout.get('exercises', [])
                rpe = workout.get('avg_rpe', 'N/A')
                notes = workout.get('notes', '')
                
                context_parts.append(f"\n**{date}:**")
                for ex in exercises[:5]:  # Show top 5 exercises
                    context_parts.append(f"  - {ex}")
                context_parts.append(f"  - Avg RPE: {rpe}/10")
                if notes:
                    context_parts.append(f"  - Notes: \"{notes}\"")
            context_parts.append("")
        
        # Active Injuries
        if active_injuries:
            context_parts.append("**Active Injuries:**")
            for injury in active_injuries:
                body_part = injury.get('body_part', 'unknown')
                severity = injury.get('severity', 'unknown')
                description = injury.get('description', '')
                reported_at = injury.get('reported_at', 'unknown')
                status = injury.get('status', 'active')
                days_since = self._calculate_days_since(reported_at)
                
                context_parts.append(f"- {body_part} ({severity}): {description}")
                context_parts.append(f"  Reported: {reported_at} ({days_since} days ago)")
                context_parts.append(f"  Status: {status}")
            context_parts.append("")
        
        # Current Readiness
        if readiness:
            context_parts.append("**Current Readiness (Today):**")
            context_parts.append(f"- Sleep Quality: {readiness.get('sleep_quality', 'N/A')}/10")
            context_parts.append(f"- Soreness: {readiness.get('soreness', 'N/A')}/10")
            context_parts.append(f"- Stress: {readiness.get('stress', 'N/A')}/10")
            context_parts.append(f"- Energy: {readiness.get('energy', 'N/A')}/10")
            context_parts.append(f"- Overall Readiness: {readiness.get('overall_score', 'N/A')}/100")
            context_parts.append("")
        
        # Instructions for AI
        context_parts.append("**Important:** Use this context to provide personalized advice. Consider their injury history, current volume, recovery status, and experience level when making recommendations.")
        
        return "\n".join(context_parts)
    
    async def _get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user profile data"""
        try:
            result = self.supabase.table('user_profiles').select('*').eq('user_id', user_id).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching user profile: {e}")
            return None
    
    async def _get_active_injuries(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch active injuries"""
        try:
            result = self.supabase.table('injury_logs').select('*').eq('user_id', user_id).in_('status', ['active', 'recovering']).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching active injuries: {e}")
            return []
    
    async def _get_recent_workouts(self, user_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Fetch recent workouts"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            result = self.supabase.table('workouts').select('*').eq('user_id', user_id).gte('date', cutoff_date).order('date', desc=True).execute()
            
            # Format workouts with exercise details
            workouts = []
            for workout in (result.data or []):
                # Fetch exercises for this workout
                exercises_result = self.supabase.table('workout_exercises').select('*').eq('workout_id', workout['id']).execute()
                exercises = exercises_result.data or []
                
                # Format exercise strings
                exercise_strings = []
                total_rpe = 0
                rpe_count = 0
                
                for ex in exercises:
                    ex_name = ex.get('exercise_name', 'Unknown')
                    weight = ex.get('weight', 0)
                    reps = ex.get('reps', 0)
                    sets = ex.get('sets', 1)
                    rpe = ex.get('rpe')
                    
                    ex_str = f"{ex_name} {sets}x{reps}"
                    if weight:
                        ex_str += f" @ {weight}lbs"
                    if rpe:
                        ex_str += f" (RPE {rpe})"
                        total_rpe += rpe
                        rpe_count += 1
                    
                    exercise_strings.append(ex_str)
                
                avg_rpe = round(total_rpe / rpe_count, 1) if rpe_count > 0 else None
                
                workouts.append({
                    'date': workout.get('date', 'unknown'),
                    'exercises': exercise_strings,
                    'avg_rpe': avg_rpe,
                    'notes': workout.get('notes', '')
                })
            
            return workouts
        except Exception as e:
            print(f"Error fetching recent workouts: {e}")
            return []
    
    async def _calculate_weekly_volume(self, user_id: str) -> Dict[str, int]:
        """Calculate weekly training volume by exercise"""
        try:
            # Get workouts from last 7 days
            cutoff_date = (datetime.now() - timedelta(days=7)).isoformat()
            workouts_result = self.supabase.table('workouts').select('id').eq('user_id', user_id).gte('date', cutoff_date).execute()
            
            if not workouts_result.data:
                return {}
            
            workout_ids = [w['id'] for w in workouts_result.data]
            
            # Get all exercises from these workouts
            exercises_result = self.supabase.table('workout_exercises').select('exercise_name, sets').in_('workout_id', workout_ids).execute()
            
            # Sum sets by exercise
            volume = {}
            for ex in (exercises_result.data or []):
                ex_name = ex.get('exercise_name', 'Unknown')
                sets = ex.get('sets', 1)
                
                # Normalize exercise names (e.g., "Bench Press" and "Barbell Bench Press" -> "Bench Press")
                normalized_name = self._normalize_exercise_name(ex_name)
                
                if normalized_name in volume:
                    volume[normalized_name] += sets
                else:
                    volume[normalized_name] = sets
            
            return volume
        except Exception as e:
            print(f"Error calculating weekly volume: {e}")
            return {}
    
    async def _get_latest_readiness(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch latest readiness check-in"""
        try:
            result = self.supabase.table('readiness_logs').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(1).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching readiness: {e}")
            return None
    
    async def _get_current_program(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch current training program"""
        try:
            result = self.supabase.table('user_programs').select('*').eq('user_id', user_id).eq('is_active', True).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching current program: {e}")
            return None
    
    def _normalize_exercise_name(self, name: str) -> str:
        """Normalize exercise names for volume tracking"""
        # Remove common prefixes
        name = name.replace('Barbell ', '').replace('Dumbbell ', '').replace('DB ', '')
        
        # Common exercise mappings
        mappings = {
            'Bench Press': 'Bench Press',
            'Squat': 'Squat',
            'Deadlift': 'Deadlift',
            'Overhead Press': 'Overhead Press',
            'OHP': 'Overhead Press',
            'Row': 'Rows',
            'Pull-up': 'Pull-ups',
            'Pullup': 'Pull-ups',
        }
        
        for key, value in mappings.items():
            if key.lower() in name.lower():
                return value
        
        return name
    
    def _calculate_days_since(self, date_str: str) -> int:
        """Calculate days since a given date"""
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            now = datetime.now(date.tzinfo)
            return (now - date).days
        except Exception:
            return 0

