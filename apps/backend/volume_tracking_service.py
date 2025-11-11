"""
Volume Tracking Service for VoiceFit

Calculates training volume by muscle group for weekly/monthly analysis.
Used for program adherence monitoring, fatigue tracking, and deload recommendations.

Volume metrics:
- Sets per muscle group
- Total reps per muscle group
- Volume load (sets × reps × weight)
- Relative intensity (% of 1RM)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase import Client


class VolumeTrackingService:
    """
    Service for tracking training volume by muscle group.
    
    Calculates weekly and monthly volume metrics for:
    - Program adherence monitoring
    - Fatigue tracking
    - Deload recommendations
    - Muscle group balance analysis
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    def get_weekly_volume(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calculate weekly training volume by muscle group.
        
        Args:
            user_id: User ID
            start_date: Start of week (defaults to last Monday)
            end_date: End of week (defaults to next Sunday)
        
        Returns:
            Dict with volume metrics:
            {
                "week_start": "2024-01-15",
                "week_end": "2024-01-21",
                "total_sets": 120,
                "total_workouts": 5,
                "volume_by_muscle": {
                    "chest": {
                        "sets": 24,
                        "total_reps": 192,
                        "volume_load": 45600,
                        "exercises": ["Bench Press", "Incline DB Press"]
                    },
                    ...
                }
            }
        """
        # Default to current week (Monday to Sunday)
        if not start_date:
            today = datetime.now()
            start_date = today - timedelta(days=today.weekday())  # Last Monday
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if not end_date:
            end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        # Fetch workouts in date range
        workouts_result = self.supabase.table('workouts')\
            .select('id, start_time')\
            .eq('user_id', user_id)\
            .gte('start_time', start_date.isoformat())\
            .lte('start_time', end_date.isoformat())\
            .execute()
        
        workouts = workouts_result.data if workouts_result.data else []
        workout_ids = [w['id'] for w in workouts]
        
        if not workout_ids:
            return self._get_empty_volume_response(start_date, end_date)
        
        # Fetch all sets for these workouts
        sets_result = self.supabase.table('workout_logs')\
            .select('*, exercises(*)')\
            .in_('workout_id', workout_ids)\
            .execute()
        
        sets_data = sets_result.data if sets_result.data else []
        
        # Calculate volume by muscle group
        volume_by_muscle = {}
        total_sets = 0
        total_volume_load = 0

        for set_data in sets_data:
            exercise = set_data.get('exercises')
            if not exercise:
                continue
            
            primary_muscle = exercise.get('primary_muscle_group', 'unknown')
            exercise_name = exercise.get('name', 'Unknown')
            
            if primary_muscle not in volume_by_muscle:
                volume_by_muscle[primary_muscle] = {
                    "sets": 0,
                    "total_reps": 0,
                    "volume_load": 0,
                    "exercises": set()
                }
            
            reps = set_data.get('reps', 0)
            weight = set_data.get('weight', 0)
            volume_load = reps * weight

            volume_by_muscle[primary_muscle]["sets"] += 1
            volume_by_muscle[primary_muscle]["total_reps"] += reps
            volume_by_muscle[primary_muscle]["volume_load"] += volume_load
            volume_by_muscle[primary_muscle]["exercises"].add(exercise_name)

            total_sets += 1
            total_volume_load += volume_load
        
        # Convert exercise sets to lists
        for muscle in volume_by_muscle:
            volume_by_muscle[muscle]["exercises"] = list(volume_by_muscle[muscle]["exercises"])

        return {
            "week_start": start_date.strftime("%Y-%m-%d"),
            "week_end": end_date.strftime("%Y-%m-%d"),
            "total_sets": total_sets,
            "total_workouts": len(workouts),
            "total_volume_load": total_volume_load,
            "volume_by_muscle": volume_by_muscle
        }
    
    def get_monthly_volume(
        self,
        user_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculate monthly training volume by muscle group.
        
        Args:
            user_id: User ID
            year: Year (defaults to current year)
            month: Month (defaults to current month)
        
        Returns:
            Dict with monthly volume metrics
        """
        # Default to current month
        if not year or not month:
            today = datetime.now()
            year = today.year
            month = today.month
        
        # Get first and last day of month
        start_date = datetime(year, month, 1)
        
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)
        
        # Fetch workouts in month
        workouts_result = self.supabase.table('workouts')\
            .select('id, start_time')\
            .eq('user_id', user_id)\
            .gte('start_time', start_date.isoformat())\
            .lte('start_time', end_date.isoformat())\
            .execute()
        
        workouts = workouts_result.data if workouts_result.data else []
        workout_ids = [w['id'] for w in workouts]
        
        if not workout_ids:
            return self._get_empty_volume_response(start_date, end_date)
        
        # Fetch all sets for these workouts
        sets_result = self.supabase.table('workout_logs')\
            .select('*, exercises(*)')\
            .in_('workout_id', workout_ids)\
            .execute()
        
        sets_data = sets_result.data if sets_result.data else []
        
        # Calculate volume by muscle group
        volume_by_muscle = {}
        total_sets = 0
        total_volume_load = 0

        for set_data in sets_data:
            exercise = set_data.get('exercises')
            if not exercise:
                continue
            
            primary_muscle = exercise.get('primary_muscle_group', 'unknown')
            exercise_name = exercise.get('name', 'Unknown')
            
            if primary_muscle not in volume_by_muscle:
                volume_by_muscle[primary_muscle] = {
                    "sets": 0,
                    "total_reps": 0,
                    "volume_load": 0,
                    "exercises": set()
                }
            
            reps = set_data.get('reps', 0)
            weight = set_data.get('weight', 0)
            volume_load = reps * weight

            volume_by_muscle[primary_muscle]["sets"] += 1
            volume_by_muscle[primary_muscle]["total_reps"] += reps
            volume_by_muscle[primary_muscle]["volume_load"] += volume_load
            volume_by_muscle[primary_muscle]["exercises"].add(exercise_name)

            total_sets += 1
            total_volume_load += volume_load

        # Convert exercise sets to lists
        for muscle in volume_by_muscle:
            volume_by_muscle[muscle]["exercises"] = list(volume_by_muscle[muscle]["exercises"])

        # Calculate average weekly sets (assuming ~4.3 weeks per month)
        days_in_period = (end_date - start_date).days + 1
        weeks_in_period = days_in_period / 7.0
        avg_weekly_sets = total_sets / weeks_in_period if weeks_in_period > 0 else 0

        return {
            "month": f"{year}-{month:02d}",
            "month_start": start_date.strftime("%Y-%m-%d"),
            "month_end": end_date.strftime("%Y-%m-%d"),
            "total_sets": total_sets,
            "total_workouts": len(workouts),
            "total_volume_load": total_volume_load,
            "avg_weekly_sets": round(avg_weekly_sets, 1),
            "volume_by_muscle": volume_by_muscle
        }
    
    def get_volume_trend(
        self,
        user_id: str,
        weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Get volume trend over multiple weeks.
        
        Args:
            user_id: User ID
            weeks: Number of weeks to analyze (default 4)
        
        Returns:
            Dict with weekly volume trend:
            {
                "weeks": [
                    {"week_start": "2024-01-01", "total_sets": 120},
                    {"week_start": "2024-01-08", "total_sets": 115},
                    ...
                ],
                "trend": "increasing" | "decreasing" | "stable",
                "avg_weekly_sets": 118.5
            }
        """
        weekly_volumes = []
        
        for i in range(weeks):
            # Calculate start date for each week (going backwards)
            today = datetime.now()
            week_offset = weeks - i - 1
            start_date = today - timedelta(days=today.weekday() + (week_offset * 7))
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
            
            volume = self.get_weekly_volume(user_id, start_date, end_date)
            
            weekly_volumes.append({
                "week_start": volume["week_start"],
                "week_end": volume["week_end"],
                "total_sets": volume["total_sets"],
                "total_workouts": volume["total_workouts"]
            })
        
        # Calculate trend
        if len(weekly_volumes) >= 2:
            first_half_avg = sum(w["total_sets"] for w in weekly_volumes[:len(weekly_volumes)//2]) / (len(weekly_volumes)//2)
            second_half_avg = sum(w["total_sets"] for w in weekly_volumes[len(weekly_volumes)//2:]) / (len(weekly_volumes) - len(weekly_volumes)//2)
            
            if second_half_avg > first_half_avg * 1.1:
                trend = "increasing"
            elif second_half_avg < first_half_avg * 0.9:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"
        
        avg_weekly_sets = sum(w["total_sets"] for w in weekly_volumes) / len(weekly_volumes) if weekly_volumes else 0
        
        return {
            "weeks": weekly_volumes,
            "trend": trend,
            "avg_weekly_sets": round(avg_weekly_sets, 1)
        }
    
    def _get_empty_volume_response(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Return empty volume response when no workouts found."""
        return {
            "week_start": start_date.strftime("%Y-%m-%d"),
            "week_end": end_date.strftime("%Y-%m-%d"),
            "total_sets": 0,
            "total_workouts": 0,
            "total_volume_load": 0,
            "volume_by_muscle": {}
        }

