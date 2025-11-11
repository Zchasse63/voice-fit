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
        recent_prs = await self._get_recent_prs(user_id, limit=5)
        recent_runs = await self._get_recent_runs(user_id, days=14)
        streaks = await self._get_user_streaks(user_id)
        badges = await self._get_user_badges(user_id)
        
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
            context_parts.append(f"- Overall Score: {readiness.get('score', 'N/A')}/100")
            context_parts.append("")

        # Recent PRs
        if recent_prs:
            context_parts.append("**Recent Personal Records (Last 30 Days):**")
            for pr in recent_prs:
                exercise = pr.get('exercise_name', 'Unknown')
                weight = pr.get('weight', 0)
                reps = pr.get('reps', 0)
                one_rm = pr.get('one_rm', 0)
                achieved_at = pr.get('achieved_at', 'unknown')
                context_parts.append(f"- {exercise}: {weight}lbs x {reps} reps (Est. 1RM: {one_rm}lbs) - {achieved_at}")
            context_parts.append("")

        # Recent Runs (Premium feature)
        if recent_runs:
            context_parts.append("**Recent Runs (Last 14 Days):**")
            for run in recent_runs[:5]:  # Show last 5 runs
                distance = run.get('distance', 0)
                duration = run.get('duration', 0)
                pace = run.get('pace', 0)
                date = run.get('start_time', 'unknown')
                context_parts.append(f"- {date}: {distance} miles in {duration} min (Pace: {pace} min/mile)")
            context_parts.append("")

        # Streaks (Premium feature)
        if streaks:
            context_parts.append("**Current Streaks:**")
            for streak in streaks:
                streak_type = streak.get('streak_type', 'unknown')
                current = streak.get('current_count', 0)
                longest = streak.get('longest_count', 0)
                context_parts.append(f"- {streak_type}: {current} days (Longest: {longest} days)")
            context_parts.append("")

        # Badges (Premium feature)
        if badges:
            context_parts.append("**Recent Badges Earned:**")
            for badge in badges[:5]:  # Show last 5 badges
                badge_name = badge.get('badge_name', 'Unknown')
                earned_at = badge.get('earned_at', 'unknown')
                context_parts.append(f"- {badge_name} - {earned_at}")
            context_parts.append("")

        # Instructions for AI
        context_parts.append("**Important:** Use this context to provide personalized advice. Consider their injury history, current volume, recovery status, experience level, recent PRs, and training consistency when making recommendations.")

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
            result = self.supabase.table('workouts').select('*').eq('user_id', user_id).gte('start_time', cutoff_date).order('start_time', desc=True).execute()

            # Format workouts with exercise details
            workouts = []
            for workout in (result.data or []):
                # Fetch workout logs (sets) for this workout
                logs_result = self.supabase.table('workout_logs').select('*').eq('workout_id', workout['id']).execute()
                logs = logs_result.data or []

                # Get unique exercise IDs
                exercise_ids = list(set([log['exercise_id'] for log in logs if log.get('exercise_id')]))

                # Fetch exercise names
                exercise_names = {}
                if exercise_ids:
                    exercises_result = self.supabase.table('exercises').select('id, original_name').in_('id', exercise_ids).execute()
                    for ex in (exercises_result.data or []):
                        exercise_names[ex['id']] = ex['original_name']

                # Group by exercise and aggregate sets
                exercise_data = {}
                total_rpe = 0
                rpe_count = 0

                for log in logs:
                    exercise_id = log.get('exercise_id')
                    exercise_name = exercise_names.get(exercise_id, 'Unknown')
                    weight = log.get('weight_used', 0)
                    reps = log.get('reps_completed', 0)
                    rpe = log.get('rpe')

                    # Group by exercise
                    if exercise_name not in exercise_data:
                        exercise_data[exercise_name] = {
                            'sets': 0,
                            'weight': weight,
                            'reps': reps,
                            'rpe': rpe
                        }
                    exercise_data[exercise_name]['sets'] += 1

                    if rpe:
                        total_rpe += rpe
                        rpe_count += 1

                # Format exercise strings
                exercise_strings = []
                for ex_name, data in exercise_data.items():
                    ex_str = f"{ex_name} {data['sets']}x{data['reps']}"
                    if data['weight']:
                        ex_str += f" @ {data['weight']}lbs"
                    if data['rpe']:
                        ex_str += f" (RPE {data['rpe']})"
                    exercise_strings.append(ex_str)

                avg_rpe = round(total_rpe / rpe_count, 1) if rpe_count > 0 else None

                workouts.append({
                    'date': workout.get('start_time', 'unknown'),
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
            workouts_result = self.supabase.table('workouts').select('id').eq('user_id', user_id).gte('start_time', cutoff_date).execute()

            if not workouts_result.data:
                return {}

            workout_ids = [w['id'] for w in workouts_result.data]

            # Get all workout logs from these workouts (each log is one set)
            logs_result = self.supabase.table('workout_logs').select('exercise_id').in_('workout_id', workout_ids).execute()

            # Get unique exercise IDs
            exercise_ids = list(set([log['exercise_id'] for log in (logs_result.data or []) if log.get('exercise_id')]))

            # Fetch exercise names
            exercise_names = {}
            if exercise_ids:
                exercises_result = self.supabase.table('exercises').select('id, original_name').in_('id', exercise_ids).execute()
                for ex in (exercises_result.data or []):
                    exercise_names[ex['id']] = ex['original_name']

            # Count sets by exercise
            volume = {}
            for log in (logs_result.data or []):
                exercise_id = log.get('exercise_id')
                ex_name = exercise_names.get(exercise_id, 'Unknown')

                # Normalize exercise names (e.g., "Bench Press" and "Barbell Bench Press" -> "Bench Press")
                normalized_name = self._normalize_exercise_name(ex_name)

                if normalized_name in volume:
                    volume[normalized_name] += 1  # Each log is one set
                else:
                    volume[normalized_name] = 1

            return volume
        except Exception as e:
            print(f"Error calculating weekly volume: {e}")
            return {}
    
    async def _get_latest_readiness(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch latest readiness check-in"""
        try:
            result = self.supabase.table('readiness_scores').select('*').eq('user_id', user_id).order('date', desc=True).limit(1).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching readiness: {e}")
            return None

    async def _get_current_program(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch current training program"""
        try:
            result = self.supabase.table('generated_programs').select('*').eq('user_profile_id', user_id).eq('is_active', True).single().execute()
            return result.data if result.data else None
        except Exception as e:
            print(f"Error fetching current program: {e}")
            return None

    async def _get_recent_prs(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch recent personal records"""
        try:
            # Get PRs from last 30 days
            cutoff_date = (datetime.now() - timedelta(days=30)).isoformat()
            result = self.supabase.table('pr_history').select('*').eq('user_id', user_id).gte('achieved_at', cutoff_date).order('achieved_at', desc=True).limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent PRs: {e}")
            return []

    async def _get_recent_runs(self, user_id: str, days: int = 14) -> List[Dict[str, Any]]:
        """Fetch recent running workouts"""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            result = self.supabase.table('runs').select('*').eq('user_id', user_id).gte('start_time', cutoff_date).order('start_time', desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent runs: {e}")
            return []

    async def _get_user_streaks(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user's current streaks"""
        try:
            result = self.supabase.table('user_streaks').select('*').eq('user_id', user_id).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching user streaks: {e}")
            return []

    async def _get_user_badges(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch user's recently earned badges"""
        try:
            result = self.supabase.table('user_badges').select('*').eq('user_id', user_id).order('earned_at', desc=True).limit(10).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching user badges: {e}")
            return []
    
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

