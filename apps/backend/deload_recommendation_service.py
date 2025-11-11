"""
Deload Recommendation Service for VoiceFit

Determines when users need deload weeks based on:
- Programmed deloads (built into program)
- Auto-regulation deloads (fatigue-based)
- Volume accumulation
- Performance decline

Provides deload recommendations with user approval required for auto-regulation.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase import Client
from fatigue_monitoring_service import FatigueMonitoringService
from volume_tracking_service import VolumeTrackingService


class DeloadRecommendationService:
    """
    Service for recommending deload weeks.
    
    Two types of deloads:
    1. Programmed deloads - Built into program (automatic, every 3-4 weeks)
    2. Auto-regulation deloads - Based on fatigue/performance (requires user approval)
    
    Deload recommendations based on:
    - Fatigue level (from FatigueMonitoringService)
    - Volume accumulation (from VolumeTrackingService)
    - Performance decline (RPE increasing, weights decreasing)
    - Time since last deload
    """
    
    def __init__(
        self,
        supabase: Client,
        fatigue_service: FatigueMonitoringService,
        volume_service: VolumeTrackingService
    ):
        self.supabase = supabase
        self.fatigue_service = fatigue_service
        self.volume_service = volume_service
    
    def check_deload_needed(
        self,
        user_id: str,
        program_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if user needs a deload week.
        
        Args:
            user_id: User ID
            program_id: Optional program ID to check programmed deloads
        
        Returns:
            Dict with deload recommendation:
            {
                "deload_needed": True/False,
                "deload_type": "programmed" | "auto_regulation" | None,
                "reason": "High fatigue detected",
                "confidence": "high" | "medium" | "low",
                "requires_approval": True/False,
                "indicators": {
                    "fatigue_level": "high",
                    "volume_trend": "increasing",
                    "performance_trend": "declining",
                    "weeks_since_deload": 4
                },
                "recommendation": "Take a deload week with 50% volume reduction"
            }
        """
        # Check for programmed deload
        programmed_deload = self._check_programmed_deload(user_id, program_id)
        
        if programmed_deload["deload_needed"]:
            return programmed_deload
        
        # Check for auto-regulation deload
        auto_regulation_deload = self._check_auto_regulation_deload(user_id)
        
        return auto_regulation_deload
    
    def _check_programmed_deload(
        self,
        user_id: str,
        program_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Check if user is due for a programmed deload week.
        
        Programmed deloads are built into the program (every 3-4 weeks).
        These are automatic and don't require user approval.
        """
        if not program_id:
            return {
                "deload_needed": False,
                "deload_type": None,
                "reason": "No active program",
                "confidence": "n/a",
                "requires_approval": False
            }
        
        # Fetch program
        program_result = self.supabase.table('generated_programs')\
            .select('*')\
            .eq('id', program_id)\
            .single()\
            .execute()
        
        if not program_result.data:
            return {
                "deload_needed": False,
                "deload_type": None,
                "reason": "Program not found",
                "confidence": "n/a",
                "requires_approval": False
            }
        
        program = program_result.data
        program_data = program.get('program_data', {})
        
        # Check if current week is a deload week
        current_week = self._get_current_program_week(program)
        
        if current_week is None:
            return {
                "deload_needed": False,
                "deload_type": None,
                "reason": "Unable to determine current week",
                "confidence": "n/a",
                "requires_approval": False
            }
        
        # Check if this week is marked as deload in program
        weeks = program_data.get('weeks', [])
        
        if current_week < len(weeks):
            week_data = weeks[current_week]
            is_deload = week_data.get('is_deload', False)
            
            if is_deload:
                return {
                    "deload_needed": True,
                    "deload_type": "programmed",
                    "reason": f"Week {current_week + 1} is a programmed deload week",
                    "confidence": "high",
                    "requires_approval": False,
                    "indicators": {
                        "current_week": current_week + 1,
                        "total_weeks": len(weeks),
                        "deload_type": "programmed"
                    },
                    "recommendation": "Follow programmed deload: 50% volume reduction, maintain intensity"
                }
        
        return {
            "deload_needed": False,
            "deload_type": None,
            "reason": "Not a programmed deload week",
            "confidence": "high",
            "requires_approval": False
        }
    
    def _check_auto_regulation_deload(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Check if user needs an auto-regulation deload based on fatigue/performance.
        
        Auto-regulation deloads require user approval.
        """
        # Get fatigue assessment
        fatigue = self.fatigue_service.assess_fatigue(user_id, days=7)
        
        # Get volume trend
        volume_trend = self.volume_service.get_volume_trend(user_id, weeks=4)
        
        # Get weeks since last deload
        weeks_since_deload = self._get_weeks_since_last_deload(user_id)
        
        # Analyze indicators
        indicators = {
            "fatigue_level": fatigue["fatigue_level"],
            "fatigue_score": fatigue["fatigue_score"],
            "volume_trend": volume_trend["trend"],
            "avg_weekly_sets": volume_trend["avg_weekly_sets"],
            "weeks_since_deload": weeks_since_deload,
            "recovery_recommendation": fatigue["recovery_recommendation"]
        }
        
        # Determine if deload is needed
        deload_needed = False
        reason = ""
        confidence = "low"
        
        # High fatigue + time since deload
        if fatigue["fatigue_level"] in ["high", "very_high"] and weeks_since_deload >= 3:
            deload_needed = True
            reason = f"High fatigue detected ({fatigue['fatigue_score']:.0f}/100) after {weeks_since_deload} weeks of training"
            confidence = "high"
        
        # Very high fatigue regardless of time
        elif fatigue["fatigue_level"] == "very_high":
            deload_needed = True
            reason = f"Very high fatigue detected ({fatigue['fatigue_score']:.0f}/100)"
            confidence = "high"
        
        # Moderate fatigue + long time since deload
        elif fatigue["fatigue_level"] == "moderate" and weeks_since_deload >= 5:
            deload_needed = True
            reason = f"Moderate fatigue after {weeks_since_deload} weeks without deload"
            confidence = "medium"
        
        # Deload recommendation from fatigue service
        elif fatigue["recovery_recommendation"] == "deload":
            deload_needed = True
            reason = "Fatigue monitoring recommends deload"
            confidence = "medium"
        
        if deload_needed:
            # Determine deload intensity based on fatigue level
            if fatigue["fatigue_level"] == "very_high":
                recommendation = "Take a full deload week: 40-50% volume reduction, maintain or reduce intensity"
            elif fatigue["fatigue_level"] == "high":
                recommendation = "Take a moderate deload: 50% volume reduction, maintain intensity"
            else:
                recommendation = "Take a light deload: 30% volume reduction, maintain intensity"
            
            return {
                "deload_needed": True,
                "deload_type": "auto_regulation",
                "reason": reason,
                "confidence": confidence,
                "requires_approval": True,  # Auto-regulation always requires approval
                "indicators": indicators,
                "recommendation": recommendation
            }
        
        return {
            "deload_needed": False,
            "deload_type": None,
            "reason": "Fatigue levels are manageable",
            "confidence": "n/a",
            "requires_approval": False,
            "indicators": indicators
        }
    
    def _get_current_program_week(self, program: Dict[str, Any]) -> Optional[int]:
        """
        Determine current week of program based on start date.
        
        Returns:
            Week number (0-indexed) or None if unable to determine
        """
        start_date_str = program.get('created_at')
        
        if not start_date_str:
            return None
        
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            today = datetime.now(start_date.tzinfo)
            
            days_elapsed = (today - start_date).days
            weeks_elapsed = days_elapsed // 7
            
            return weeks_elapsed
        except Exception:
            return None
    
    def _get_weeks_since_last_deload(self, user_id: str) -> int:
        """
        Get number of weeks since last deload.
        
        Checks workout notes for "deload" keyword.
        """
        # Look back up to 12 weeks
        end_date = datetime.now()
        start_date = end_date - timedelta(weeks=12)
        
        # Fetch workouts with notes
        workouts_result = self.supabase.table('workouts')\
            .select('start_time, notes')\
            .eq('user_id', user_id)\
            .gte('start_time', start_date.isoformat())\
            .lte('start_time', end_date.isoformat())\
            .order('start_time', desc=True)\
            .execute()
        
        workouts = workouts_result.data if workouts_result.data else []
        
        # Find most recent deload
        for workout in workouts:
            notes = workout.get('notes') or ''
            notes_lower = notes.lower() if notes else ''

            if 'deload' in notes_lower:
                # Calculate weeks since this workout
                workout_date = datetime.fromisoformat(workout['start_time'].replace('Z', '+00:00'))
                weeks_since = (end_date - workout_date).days // 7
                return weeks_since
        
        # No deload found in last 12 weeks
        return 12
    
    def create_deload_week(
        self,
        user_id: str,
        program_id: str,
        volume_reduction: float = 0.5
    ) -> Dict[str, Any]:
        """
        Create a deload week by modifying the current program week.
        
        Args:
            user_id: User ID
            program_id: Program ID
            volume_reduction: Volume reduction (0.5 = 50% reduction)
        
        Returns:
            Dict with deload week data
        """
        # This would modify the program to create a deload week
        # For now, return a template
        return {
            "deload_week_created": True,
            "volume_reduction": volume_reduction,
            "instructions": [
                f"Reduce volume by {int(volume_reduction * 100)}%",
                "Maintain intensity (same weights)",
                "Focus on technique and recovery",
                "Increase rest between sets if needed"
            ]
        }

