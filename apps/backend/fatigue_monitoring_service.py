"""
Fatigue Monitoring Service for VoiceFit

Monitors training fatigue using multiple indicators:
- Readiness scores
- RPE trends
- Volume accumulation
- Sleep quality
- Soreness levels

Provides fatigue assessment and recovery recommendations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from supabase import Client


class FatigueMonitoringService:
    """
    Service for monitoring training fatigue and recovery status.
    
    Uses multiple indicators:
    - Readiness scores (HRV, sleep, soreness)
    - RPE trends (increasing RPE for same workouts)
    - Volume accumulation (weekly volume vs baseline)
    - Sleep quality (duration and quality ratings)
    - Soreness levels (muscle soreness ratings)
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    def assess_fatigue(
        self,
        user_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Assess current fatigue level using multiple indicators.
        
        Args:
            user_id: User ID
            days: Number of days to analyze (default 7)
        
        Returns:
            Dict with fatigue assessment:
            {
                "fatigue_level": "low" | "moderate" | "high" | "very_high",
                "fatigue_score": 0-100,
                "indicators": {
                    "readiness_trend": "declining" | "stable" | "improving",
                    "rpe_trend": "increasing" | "stable" | "decreasing",
                    "volume_status": "normal" | "elevated" | "very_high",
                    "sleep_quality": "poor" | "fair" | "good",
                    "soreness_level": "low" | "moderate" | "high"
                },
                "recovery_recommendation": "continue" | "reduce_volume" | "deload" | "rest",
                "days_until_recovery": 1-7
            }
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Fetch readiness scores
        readiness_result = self.supabase.table('readiness_scores')\
            .select('*')\
            .eq('user_id', user_id)\
            .gte('date', start_date.strftime('%Y-%m-%d'))\
            .lte('date', end_date.strftime('%Y-%m-%d'))\
            .order('date', desc=False)\
            .execute()
        
        readiness_scores = readiness_result.data if readiness_result.data else []
        
        # Fetch recent workouts
        workouts_result = self.supabase.table('workouts')\
            .select('id, start_time')\
            .eq('user_id', user_id)\
            .gte('start_time', start_date.isoformat())\
            .lte('start_time', end_date.isoformat())\
            .execute()
        
        workouts = workouts_result.data if workouts_result.data else []
        workout_ids = [w['id'] for w in workouts]
        
        # Fetch workout sets for RPE analysis
        sets_data = []
        if workout_ids:
            sets_result = self.supabase.table('workout_logs')\
                .select('*')\
                .in_('workout_id', workout_ids)\
                .execute()
            sets_data = sets_result.data if sets_result.data else []
        
        # Analyze indicators
        indicators = self._analyze_indicators(readiness_scores, sets_data, len(workouts))
        
        # Calculate fatigue score (0-100, higher = more fatigued)
        fatigue_score = self._calculate_fatigue_score(indicators)
        
        # Determine fatigue level
        if fatigue_score < 25:
            fatigue_level = "low"
        elif fatigue_score < 50:
            fatigue_level = "moderate"
        elif fatigue_score < 75:
            fatigue_level = "high"
        else:
            fatigue_level = "very_high"
        
        # Recovery recommendation
        recovery_rec = self._get_recovery_recommendation(fatigue_level, indicators)
        
        # Estimate days until recovery
        days_until_recovery = self._estimate_recovery_days(fatigue_level, indicators)
        
        return {
            "fatigue_level": fatigue_level,
            "fatigue_score": round(fatigue_score, 1),
            "indicators": indicators,
            "recovery_recommendation": recovery_rec,
            "days_until_recovery": days_until_recovery
        }
    
    def _analyze_indicators(
        self,
        readiness_scores: List[Dict[str, Any]],
        sets_data: List[Dict[str, Any]],
        workout_count: int
    ) -> Dict[str, Any]:
        """Analyze individual fatigue indicators."""
        indicators = {}
        
        # Readiness trend
        if len(readiness_scores) >= 3:
            recent_scores = [r['score'] for r in readiness_scores[-3:]]
            older_scores = [r['score'] for r in readiness_scores[:3]]
            
            recent_avg = sum(recent_scores) / len(recent_scores)
            older_avg = sum(older_scores) / len(older_scores)
            
            if recent_avg < older_avg - 5:
                indicators["readiness_trend"] = "declining"
            elif recent_avg > older_avg + 5:
                indicators["readiness_trend"] = "improving"
            else:
                indicators["readiness_trend"] = "stable"
        else:
            indicators["readiness_trend"] = "insufficient_data"
        
        # RPE trend
        if len(sets_data) >= 10:
            recent_rpe = [s['rpe'] for s in sets_data[-10:] if s.get('rpe')]
            older_rpe = [s['rpe'] for s in sets_data[:10] if s.get('rpe')]
            
            if recent_rpe and older_rpe:
                recent_avg_rpe = sum(recent_rpe) / len(recent_rpe)
                older_avg_rpe = sum(older_rpe) / len(older_rpe)
                
                if recent_avg_rpe > older_avg_rpe + 0.5:
                    indicators["rpe_trend"] = "increasing"
                elif recent_avg_rpe < older_avg_rpe - 0.5:
                    indicators["rpe_trend"] = "decreasing"
                else:
                    indicators["rpe_trend"] = "stable"
            else:
                indicators["rpe_trend"] = "insufficient_data"
        else:
            indicators["rpe_trend"] = "insufficient_data"
        
        # Volume status (workouts per week)
        if workout_count > 6:
            indicators["volume_status"] = "very_high"
        elif workout_count > 4:
            indicators["volume_status"] = "elevated"
        else:
            indicators["volume_status"] = "normal"
        
        # Sleep quality (from most recent readiness score)
        if readiness_scores:
            latest_readiness = readiness_scores[-1]
            sleep_score = latest_readiness.get('sleep_quality', 5)
            
            if sleep_score >= 8:
                indicators["sleep_quality"] = "good"
            elif sleep_score >= 5:
                indicators["sleep_quality"] = "fair"
            else:
                indicators["sleep_quality"] = "poor"
        else:
            indicators["sleep_quality"] = "unknown"
        
        # Soreness level (from most recent readiness score)
        if readiness_scores:
            latest_readiness = readiness_scores[-1]
            soreness = latest_readiness.get('soreness_level', 5)
            
            if soreness >= 7:
                indicators["soreness_level"] = "high"
            elif soreness >= 4:
                indicators["soreness_level"] = "moderate"
            else:
                indicators["soreness_level"] = "low"
        else:
            indicators["soreness_level"] = "unknown"
        
        return indicators
    
    def _calculate_fatigue_score(self, indicators: Dict[str, Any]) -> float:
        """
        Calculate overall fatigue score (0-100).
        Higher score = more fatigued.
        """
        score = 0
        
        # Readiness trend (0-25 points)
        if indicators["readiness_trend"] == "declining":
            score += 25
        elif indicators["readiness_trend"] == "stable":
            score += 12
        elif indicators["readiness_trend"] == "improving":
            score += 0
        
        # RPE trend (0-25 points)
        if indicators["rpe_trend"] == "increasing":
            score += 25
        elif indicators["rpe_trend"] == "stable":
            score += 12
        elif indicators["rpe_trend"] == "decreasing":
            score += 0
        
        # Volume status (0-20 points)
        if indicators["volume_status"] == "very_high":
            score += 20
        elif indicators["volume_status"] == "elevated":
            score += 10
        else:
            score += 0
        
        # Sleep quality (0-15 points)
        if indicators["sleep_quality"] == "poor":
            score += 15
        elif indicators["sleep_quality"] == "fair":
            score += 7
        else:
            score += 0
        
        # Soreness level (0-15 points)
        if indicators["soreness_level"] == "high":
            score += 15
        elif indicators["soreness_level"] == "moderate":
            score += 7
        else:
            score += 0
        
        return min(score, 100)
    
    def _get_recovery_recommendation(
        self,
        fatigue_level: str,
        indicators: Dict[str, Any]
    ) -> str:
        """Get recovery recommendation based on fatigue level."""
        if fatigue_level == "very_high":
            return "deload"
        elif fatigue_level == "high":
            if indicators["sleep_quality"] == "poor" or indicators["soreness_level"] == "high":
                return "rest"
            else:
                return "reduce_volume"
        elif fatigue_level == "moderate":
            if indicators["readiness_trend"] == "declining":
                return "reduce_volume"
            else:
                return "continue"
        else:
            return "continue"
    
    def _estimate_recovery_days(
        self,
        fatigue_level: str,
        indicators: Dict[str, Any]
    ) -> int:
        """Estimate days until full recovery."""
        if fatigue_level == "very_high":
            return 7
        elif fatigue_level == "high":
            if indicators["sleep_quality"] == "poor":
                return 5
            else:
                return 3
        elif fatigue_level == "moderate":
            return 2
        else:
            return 1
    
    def get_fatigue_history(
        self,
        user_id: str,
        weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Get fatigue history over multiple weeks.
        
        Args:
            user_id: User ID
            weeks: Number of weeks to analyze
        
        Returns:
            Dict with weekly fatigue assessments
        """
        weekly_fatigue = []
        
        for i in range(weeks):
            # Calculate date range for each week
            end_date = datetime.now() - timedelta(days=i * 7)
            start_date = end_date - timedelta(days=7)
            
            # Get fatigue assessment for this week
            assessment = self.assess_fatigue(user_id, days=7)
            
            weekly_fatigue.append({
                "week_start": start_date.strftime("%Y-%m-%d"),
                "week_end": end_date.strftime("%Y-%m-%d"),
                "fatigue_level": assessment["fatigue_level"],
                "fatigue_score": assessment["fatigue_score"]
            })
        
        # Reverse to show oldest to newest
        weekly_fatigue.reverse()
        
        return {
            "weeks": weekly_fatigue,
            "current_fatigue_level": weekly_fatigue[-1]["fatigue_level"] if weekly_fatigue else "unknown"
        }

