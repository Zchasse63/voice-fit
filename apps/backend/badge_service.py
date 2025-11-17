"""
BadgeService - Detects and awards badges for VoiceFit achievements

Handles 90 badges across 4 categories:
- Strength Training (30 badges): Workout count, volume, PRs, plate milestones, strength clubs
- Running (40 badges): Distance, speed, pace, elevation, weather
- Streaks (12 badges): Workout streaks, weekly consistency, run streaks
- Hybrid (8 badges): Cross-training, iron athlete, program completion

Research-backed standards from Nike Run Club, Strava, Peloton, JEFIT, Duolingo
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from supabase import Client


@dataclass
class BadgeDefinition:
    """Badge metadata"""

    badge_type: str
    badge_name: str
    badge_description: str
    category: str  # 'strength', 'running', 'streak', 'hybrid'


class BadgeService:
    """Service for detecting and awarding badges"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self._init_badge_definitions()

    def _init_badge_definitions(self):
        """Initialize all 90 badge definitions"""
        self.badges: Dict[str, BadgeDefinition] = {}

        # STRENGTH TRAINING BADGES (30 total)
        self._add_workout_count_badges()
        self._add_volume_badges()
        self._add_pr_count_badges()
        self._add_plate_milestone_badges()
        self._add_strength_club_badges()

        # RUNNING BADGES (40 total)
        self._add_run_distance_badges()
        self._add_run_single_distance_badges()
        self._add_run_speed_badges()
        self._add_run_pace_badges()
        self._add_run_elevation_badges()
        self._add_run_weather_badges()

        # STREAK BADGES (12 total)
        self._add_workout_streak_badges()
        self._add_weekly_consistency_badges()
        self._add_run_streak_badges()

        # HYBRID BADGES (8 total)
        self._add_hybrid_badges()

    # ============================================================================
    # STRENGTH TRAINING BADGE DEFINITIONS
    # ============================================================================

    def _add_workout_count_badges(self):
        """Workout count milestones (9 badges)"""
        milestones = [1, 5, 10, 25, 50, 100, 250, 500, 1000]
        for count in milestones:
            self.badges[f"workout_count_{count}"] = BadgeDefinition(
                badge_type=f"workout_count_{count}",
                badge_name=f"{count} Workout{'s' if count > 1 else ''}",
                badge_description=f"Complete {count} strength training workout{'s' if count > 1 else ''}",
                category="strength",
            )

    def _add_volume_badges(self):
        """Volume/tonnage milestones (8 badges)"""
        milestones = [
            (50_000, "50K"),
            (100_000, "100K"),
            (250_000, "250K"),
            (500_000, "500K"),
            (1_000_000, "1M"),
            (2_500_000, "2.5M"),
            (5_000_000, "5M"),
            (10_000_000, "10M"),
        ]
        for lbs, label in milestones:
            self.badges[f"volume_milestone_{label.lower().replace('.', '_')}"] = (
                BadgeDefinition(
                    badge_type=f"volume_milestone_{label.lower().replace('.', '_')}",
                    badge_name=f"{label} Club",
                    badge_description=f"Lift {lbs:,} lbs total volume",
                    category="strength",
                )
            )

    def _add_pr_count_badges(self):
        """PR count milestones (8 badges)"""
        milestones = [1, 5, 10, 25, 50, 100, 250, 500]
        for count in milestones:
            self.badges[f"pr_count_{count}"] = BadgeDefinition(
                badge_type=f"pr_count_{count}",
                badge_name=f"{count} PR{'s' if count > 1 else ''}",
                badge_description=f"Hit {count} personal record{'s' if count > 1 else ''}",
                category="strength",
            )

    def _add_plate_milestone_badges(self):
        """Plate milestones (9 badges)"""
        plates = [
            ("bench", 1, 135),
            ("bench", 2, 225),
            ("bench", 3, 315),
            ("squat", 2, 225),
            ("squat", 3, 315),
            ("squat", 4, 405),
            ("deadlift", 3, 315),
            ("deadlift", 4, 405),
            ("deadlift", 5, 495),
        ]
        for exercise, plate_count, lbs in plates:
            self.badges[f"plate_milestone_{exercise}_{plate_count}"] = BadgeDefinition(
                badge_type=f"plate_milestone_{exercise}_{plate_count}",
                badge_name=f"{plate_count}-Plate {exercise.title()}",
                badge_description=f"{lbs} lbs {exercise} (1RM)",
                category="strength",
            )

    def _add_strength_club_badges(self):
        """Total strength clubs (2 badges)"""
        clubs = [(1000, "1000-Pound Club"), (1500, "1500-Pound Club")]
        for total, name in clubs:
            self.badges[f"total_strength_club_{total}"] = BadgeDefinition(
                badge_type=f"total_strength_club_{total}",
                badge_name=name,
                badge_description=f"Squat + Bench + Deadlift ≥ {total} lbs",
                category="strength",
            )

    # ============================================================================
    # RUNNING BADGE DEFINITIONS
    # ============================================================================

    def _add_run_distance_badges(self):
        """Total distance milestones (8 badges)"""
        milestones = [1, 10, 50, 100, 250, 500, 1000, 2500]
        for miles in milestones:
            self.badges[f"run_distance_total_{miles}"] = BadgeDefinition(
                badge_type=f"run_distance_total_{miles}",
                badge_name=f"{miles} Mile{'s' if miles > 1 else ''}",
                badge_description=f"Run {miles} mile{'s' if miles > 1 else ''} total",
                category="running",
            )

    def _add_run_single_distance_badges(self):
        """Single run distance achievements (7 badges)"""
        distances = [
            ("5k", "5K Finisher", 3.1),
            ("10k", "10K Finisher", 6.2),
            ("15k", "15K Finisher", 9.3),
            ("half", "Half Marathon", 13.1),
            ("20mi", "20 Miler", 20.0),
            ("marathon", "Marathon", 26.2),
            ("ultra", "Ultra Runner", 31.0),
        ]
        for key, name, miles in distances:
            self.badges[f"run_distance_single_{key}"] = BadgeDefinition(
                badge_type=f"run_distance_single_{key}",
                badge_name=name,
                badge_description=f"Complete a {miles}-mile run",
                category="running",
            )

    def _add_run_speed_badges(self):
        """Speed achievements for 5K, 10K, Mile (16 badges)"""
        # 5K speed (6 badges)
        for minutes in [30, 27, 25, 22, 20, 18]:
            self.badges[f"run_speed_5k_sub_{minutes}"] = BadgeDefinition(
                badge_type=f"run_speed_5k_sub_{minutes}",
                badge_name=f"5K Sub-{minutes}",
                badge_description=f"Run 5K in under {minutes} minutes",
                category="running",
            )

        # 10K speed (5 badges)
        for minutes in [60, 55, 50, 45, 40]:
            self.badges[f"run_speed_10k_sub_{minutes}"] = BadgeDefinition(
                badge_type=f"run_speed_10k_sub_{minutes}",
                badge_name=f"10K Sub-{minutes}",
                badge_description=f"Run 10K in under {minutes} minutes",
                category="running",
            )

        # Mile speed (5 badges)
        for minutes in [10, 9, 8, 7, 6]:
            self.badges[f"run_speed_mile_sub_{minutes}"] = BadgeDefinition(
                badge_type=f"run_speed_mile_sub_{minutes}",
                badge_name=f"Mile Sub-{minutes}",
                badge_description=f"Run 1 mile in under {minutes} minutes",
                category="running",
            )

    def _add_run_pace_badges(self):
        """Average pace achievements (4 badges)"""
        for pace in [10, 9, 8, 7]:
            self.badges[f"run_pace_sub_{pace}"] = BadgeDefinition(
                badge_type=f"run_pace_sub_{pace}",
                badge_name=f"Sub-{pace} Pace",
                badge_description=f"Average pace under {pace}:00/mile",
                category="running",
            )

    def _add_run_elevation_badges(self):
        """Elevation achievements (4 badges)"""
        elevations = [
            (500, "Hill Climber"),
            (1000, "Mountain Goat"),
            (2500, "Peak Bagger"),
            (5000, "Summit Seeker"),
        ]
        for feet, name in elevations:
            self.badges[f"run_elevation_{feet}"] = BadgeDefinition(
                badge_type=f"run_elevation_{feet}",
                badge_name=name,
                badge_description=f"{feet} ft elevation gain in single run",
                category="running",
            )

    def _add_run_weather_badges(self):
        """Weather warrior badges (3 badges)"""
        weather = [
            ("rain", "Rain Runner", "10 runs in the rain"),
            ("cold", "Cold Warrior", "10 runs in <32°F weather"),
            ("heat", "Heat Champion", "10 runs in >90°F weather"),
        ]
        for key, name, desc in weather:
            self.badges[f"run_weather_{key}"] = BadgeDefinition(
                badge_type=f"run_weather_{key}",
                badge_name=name,
                badge_description=desc,
                category="running",
            )

    # ============================================================================
    # STREAK BADGE DEFINITIONS
    # ============================================================================

    def _add_workout_streak_badges(self):
        """Workout streak badges (6 badges)"""
        for days in [7, 14, 30, 60, 100, 365]:
            self.badges[f"workout_streak_{days}"] = BadgeDefinition(
                badge_type=f"workout_streak_{days}",
                badge_name=f"{days}-Day Streak",
                badge_description=f"Train {days} consecutive days",
                category="streak",
            )

    def _add_weekly_consistency_badges(self):
        """Weekly consistency badges (4 badges)"""
        for weeks in [4, 12, 26, 52]:
            self.badges[f"weekly_consistency_{weeks}"] = BadgeDefinition(
                badge_type=f"weekly_consistency_{weeks}",
                badge_name=f"{weeks}-Week Warrior",
                badge_description=f"Train at least once per week for {weeks} weeks",
                category="streak",
            )

    def _add_run_streak_badges(self):
        """Run streak badges (3 badges)"""
        for days in [7, 30, 100]:
            self.badges[f"run_streak_{days}"] = BadgeDefinition(
                badge_type=f"run_streak_{days}",
                badge_name=f"{days}-Day Run Streak",
                badge_description=f"Run {days} consecutive days",
                category="streak",
            )

    # ============================================================================
    # HYBRID BADGE DEFINITIONS
    # ============================================================================

    def _add_hybrid_badges(self):
        """Hybrid achievement badges (8 badges)"""
        # Cross-training (3 badges)
        cross_training = [
            (25, "Hybrid Athlete"),
            (100, "Iron Runner"),
            (500, "Ultimate Athlete"),
        ]
        for count, name in cross_training:
            self.badges[f"hybrid_cross_training_{count}"] = BadgeDefinition(
                badge_type=f"hybrid_cross_training_{count}",
                badge_name=name,
                badge_description=f"Complete {count} workouts AND {count} runs",
                category="hybrid",
            )

        # Iron athlete (2 badges)
        iron = [(50, 250, "Bronze"), (100, 500, "Gold")]
        for prs, miles, tier in iron:
            self.badges[f"hybrid_iron_athlete_{tier.lower()}"] = BadgeDefinition(
                badge_type=f"hybrid_iron_athlete_{tier.lower()}",
                badge_name=f"Iron Athlete {tier}",
                badge_description=f"Hit {prs} PRs AND run {miles} miles",
                category="hybrid",
            )

        # Program completion (4 badges)
        for count in [1, 3, 5, 10]:
            self.badges[f"program_complete_{count}"] = BadgeDefinition(
                badge_type=f"program_complete_{count}",
                badge_name=f"{count} Program{'s' if count > 1 else ''} Complete",
                badge_description=f"Complete {count} 12-week program{'s' if count > 1 else ''}",
                category="hybrid",
            )

    # ============================================================================
    # BADGE DETECTION - STRENGTH TRAINING
    # ============================================================================

    async def check_workout_badges(self, user_id: str) -> List[str]:
        """
        Check for workout-related badges after workout completion
        Returns list of newly earned badge types
        """
        newly_earned = []

        # Get total workout count
        workout_count = await self._get_workout_count(user_id)

        # Check workout count badges
        for milestone in [1, 5, 10, 25, 50, 100, 250, 500, 1000]:
            badge_type = f"workout_count_{milestone}"
            if workout_count >= milestone:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Get total volume (tonnage)
        total_volume = await self._get_total_volume(user_id)

        # Check volume badges
        volume_milestones = [
            (50_000, "50k"),
            (100_000, "100k"),
            (250_000, "250k"),
            (500_000, "500k"),
            (1_000_000, "1m"),
            (2_500_000, "2_5m"),
            (5_000_000, "5m"),
            (10_000_000, "10m"),
        ]
        for lbs, label in volume_milestones:
            badge_type = f"volume_milestone_{label}"
            if total_volume >= lbs:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        return newly_earned

    async def check_pr_badges(self, user_id: str) -> List[str]:
        """
        Check for PR-related badges after PR detection
        Returns list of newly earned badge types
        """
        newly_earned = []

        # Get total PR count
        pr_count = await self._get_pr_count(user_id)

        # Check PR count badges
        for milestone in [1, 5, 10, 25, 50, 100, 250, 500]:
            badge_type = f"pr_count_{milestone}"
            if pr_count >= milestone:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check plate milestone badges
        plate_badges = await self._check_plate_milestones(user_id)
        newly_earned.extend(plate_badges)

        # Check strength club badges
        club_badges = await self._check_strength_clubs(user_id)
        newly_earned.extend(club_badges)

        return newly_earned

    async def _check_plate_milestones(self, user_id: str) -> List[str]:
        """Check for plate milestone badges (1-plate, 2-plate, etc.)"""
        newly_earned = []

        # Get best 1RMs for bench, squat, deadlift
        bench_1rm = await self._get_best_1rm(user_id, "bench press")
        squat_1rm = await self._get_best_1rm(user_id, "squat")
        deadlift_1rm = await self._get_best_1rm(user_id, "deadlift")

        # Check bench plate milestones
        bench_plates = [(1, 135), (2, 225), (3, 315)]
        for plates, lbs in bench_plates:
            if bench_1rm >= lbs:
                badge_type = f"plate_milestone_bench_{plates}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check squat plate milestones
        squat_plates = [(2, 225), (3, 315), (4, 405)]
        for plates, lbs in squat_plates:
            if squat_1rm >= lbs:
                badge_type = f"plate_milestone_squat_{plates}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check deadlift plate milestones
        deadlift_plates = [(3, 315), (4, 405), (5, 495)]
        for plates, lbs in deadlift_plates:
            if deadlift_1rm >= lbs:
                badge_type = f"plate_milestone_deadlift_{plates}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        return newly_earned

    async def _check_strength_clubs(self, user_id: str) -> List[str]:
        """Check for 1000-lb and 1500-lb club badges"""
        newly_earned = []

        # Get best 1RMs for the big 3
        bench_1rm = await self._get_best_1rm(user_id, "bench press")
        squat_1rm = await self._get_best_1rm(user_id, "squat")
        deadlift_1rm = await self._get_best_1rm(user_id, "deadlift")

        total = bench_1rm + squat_1rm + deadlift_1rm

        # Check 1000-lb club
        if total >= 1000:
            if await self._award_badge_if_new(user_id, "total_strength_club_1000"):
                newly_earned.append("total_strength_club_1000")

        # Check 1500-lb club
        if total >= 1500:
            if await self._award_badge_if_new(user_id, "total_strength_club_1500"):
                newly_earned.append("total_strength_club_1500")

        return newly_earned

    # ============================================================================
    # BADGE DETECTION - RUNNING
    # ============================================================================

    async def check_run_badges(
        self, user_id: str, run_data: Dict[str, Any]
    ) -> List[str]:
        """
        Check for running-related badges after run completion

        Args:
            user_id: User ID
            run_data: Run data including distance, duration, elevation, weather

        Returns:
            List of newly earned badge types
        """
        newly_earned = []

        # Get total distance
        total_distance = await self._get_total_run_distance(user_id)

        # Check total distance badges
        for miles in [1, 10, 50, 100, 250, 500, 1000, 2500]:
            badge_type = f"run_distance_total_{miles}"
            if total_distance >= miles:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check single run distance badges (convert km to miles)
        run_distance_km = run_data.get("distance", 0)
        run_distance = run_distance_km * 0.621371
        distance_badges = [
            (3.1, "5k"),
            (6.2, "10k"),
            (9.3, "15k"),
            (13.1, "half"),
            (20.0, "20mi"),
            (26.2, "marathon"),
            (31.0, "ultra"),
        ]
        for miles, key in distance_badges:
            if run_distance >= miles:
                badge_type = f"run_distance_single_{key}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check speed badges (5K, 10K, Mile)
        speed_badges = await self._check_run_speed_badges(user_id, run_data)
        newly_earned.extend(speed_badges)

        # Check pace badges
        pace_badges = await self._check_run_pace_badges(user_id, run_data)
        newly_earned.extend(pace_badges)

        # Check elevation badges
        elevation_badges = await self._check_run_elevation_badges(user_id, run_data)
        newly_earned.extend(elevation_badges)

        # Check weather badges
        weather_badges = await self._check_run_weather_badges(user_id, run_data)
        newly_earned.extend(weather_badges)

        return newly_earned

    async def _check_run_speed_badges(
        self, user_id: str, run_data: Dict[str, Any]
    ) -> List[str]:
        """Check for speed achievement badges (5K, 10K, Mile)"""
        newly_earned = []

        # Convert km to miles (DB stores in km, badges check in miles)
        distance_km = run_data.get("distance", 0)
        distance = distance_km * 0.621371
        duration_minutes = run_data.get("duration_seconds", 0) / 60

        # Check 5K speed (3.1 miles ± 0.1)
        if 3.0 <= distance <= 3.2:
            for minutes in [30, 27, 25, 22, 20, 18]:
                if duration_minutes < minutes:
                    badge_type = f"run_speed_5k_sub_{minutes}"
                    if await self._award_badge_if_new(user_id, badge_type):
                        newly_earned.append(badge_type)

        # Check 10K speed (6.2 miles ± 0.1)
        if 6.1 <= distance <= 6.3:
            for minutes in [60, 55, 50, 45, 40]:
                if duration_minutes < minutes:
                    badge_type = f"run_speed_10k_sub_{minutes}"
                    if await self._award_badge_if_new(user_id, badge_type):
                        newly_earned.append(badge_type)

        # Check Mile speed (1.0 miles ± 0.05)
        if 0.95 <= distance <= 1.05:
            for minutes in [10, 9, 8, 7, 6]:
                if duration_minutes < minutes:
                    badge_type = f"run_speed_mile_sub_{minutes}"
                    if await self._award_badge_if_new(user_id, badge_type):
                        newly_earned.append(badge_type)

        return newly_earned

    async def _check_run_pace_badges(
        self, user_id: str, run_data: Dict[str, Any]
    ) -> List[str]:
        """Check for average pace badges"""
        newly_earned = []

        # Convert km to miles (DB stores in km, badges check in miles)
        distance_km = run_data.get("distance", 0)
        distance = distance_km * 0.621371
        duration_minutes = run_data.get("duration_seconds", 0) / 60

        if distance > 0:
            pace_per_mile = duration_minutes / distance  # minutes per mile

            for pace in [10, 9, 8, 7]:
                if pace_per_mile < pace:
                    badge_type = f"run_pace_sub_{pace}"
                    if await self._award_badge_if_new(user_id, badge_type):
                        newly_earned.append(badge_type)

        return newly_earned

    async def _check_run_elevation_badges(
        self, user_id: str, run_data: Dict[str, Any]
    ) -> List[str]:
        """Check for elevation gain badges"""
        newly_earned = []

        elevation_gain = run_data.get("elevation_gain_feet", 0)

        elevations = [(500, "500"), (1000, "1000"), (2500, "2500"), (5000, "5000")]
        for feet, label in elevations:
            if elevation_gain >= feet:
                badge_type = f"run_elevation_{feet}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        return newly_earned

    async def _check_run_weather_badges(
        self, user_id: str, run_data: Dict[str, Any]
    ) -> List[str]:
        """Check for weather warrior badges"""
        newly_earned = []

        weather = run_data.get("weather_conditions", "")
        temp_f = run_data.get("temperature_f", None)

        # Count weather-specific runs
        if "rain" in weather.lower():
            rain_count = await self._get_weather_run_count(user_id, "rain")
            if rain_count >= 10:
                if await self._award_badge_if_new(user_id, "run_weather_rain"):
                    newly_earned.append("run_weather_rain")

        if temp_f is not None and temp_f < 32:
            cold_count = await self._get_weather_run_count(user_id, "cold")
            if cold_count >= 10:
                if await self._award_badge_if_new(user_id, "run_weather_cold"):
                    newly_earned.append("run_weather_cold")

        if temp_f is not None and temp_f > 90:
            heat_count = await self._get_weather_run_count(user_id, "heat")
            if heat_count >= 10:
                if await self._award_badge_if_new(user_id, "run_weather_heat"):
                    newly_earned.append("run_weather_heat")

        return newly_earned

    # ============================================================================
    # BADGE DETECTION - STREAKS
    # ============================================================================

    async def check_streak_badges(self, user_id: str) -> List[str]:
        """
        Check for streak-related badges
        Should be called daily or after workout/run completion

        Returns list of newly earned badge types
        """
        newly_earned = []

        # Get current workout streak
        workout_streak = await self._get_current_workout_streak(user_id)

        # Check workout streak badges
        for days in [7, 14, 30, 60, 100, 365]:
            badge_type = f"workout_streak_{days}"
            if workout_streak >= days:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Get current run streak
        run_streak = await self._get_current_run_streak(user_id)

        # Check run streak badges
        for days in [7, 30, 100]:
            badge_type = f"run_streak_{days}"
            if run_streak >= days:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check weekly consistency
        weekly_consistency = await self._get_weekly_consistency(user_id)

        for weeks in [4, 12, 26, 52]:
            badge_type = f"weekly_consistency_{weeks}"
            if weekly_consistency >= weeks:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        return newly_earned

    # ============================================================================
    # BADGE DETECTION - HYBRID
    # ============================================================================

    async def check_hybrid_badges(self, user_id: str) -> List[str]:
        """
        Check for hybrid achievement badges (strength + running)

        Returns list of newly earned badge types
        """
        newly_earned = []

        # Get workout and run counts
        workout_count = await self._get_workout_count(user_id)
        run_count = await self._get_run_count(user_id)

        # Check cross-training badges (equal workouts and runs)
        cross_training = [(25, "25"), (100, "100"), (500, "500")]
        for count, label in cross_training:
            if workout_count >= count and run_count >= count:
                badge_type = f"hybrid_cross_training_{count}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Get PR count and total run distance
        pr_count = await self._get_pr_count(user_id)
        total_miles = await self._get_total_run_distance(user_id)

        # Check iron athlete badges
        iron = [(50, 250, "bronze"), (100, 500, "gold")]
        for prs, miles, tier in iron:
            if pr_count >= prs and total_miles >= miles:
                badge_type = f"hybrid_iron_athlete_{tier}"
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        # Check program completion badges
        programs_completed = await self._get_programs_completed(user_id)

        for count in [1, 3, 5, 10]:
            badge_type = f"program_complete_{count}"
            if programs_completed >= count:
                if await self._award_badge_if_new(user_id, badge_type):
                    newly_earned.append(badge_type)

        return newly_earned

    # ============================================================================
    # HELPER METHODS - DATABASE QUERIES
    # ============================================================================

    async def _award_badge_if_new(self, user_id: str, badge_type: str) -> bool:
        """
        Award badge if user doesn't already have it

        Returns:
            True if badge was newly awarded, False if already earned
        """
        # Check if user already has this badge
        result = (
            self.supabase.table("user_badges")
            .select("id")
            .eq("user_id", user_id)
            .eq("badge_type", badge_type)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return False  # Already has badge

        # Award the badge
        badge_def = self.badges.get(badge_type)
        if not badge_def:
            print(f"Warning: Unknown badge type {badge_type}")
            return False

        self.supabase.table("user_badges").insert(
            {
                "user_id": user_id,
                "badge_type": badge_type,
                "badge_name": badge_def.badge_name,
                "badge_description": badge_def.badge_description,
                "earned_at": datetime.utcnow().isoformat(),
            }
        ).execute()

        print(f"✅ Badge awarded: {badge_def.badge_name} to user {user_id}")
        return True

    async def _get_workout_count(self, user_id: str) -> int:
        """Get total number of workouts completed"""
        result = (
            self.supabase.table("workouts")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0

    async def _get_total_volume(self, user_id: str) -> float:
        """Get total volume (tonnage) lifted in lbs"""
        # Query all sets for this user
        result = (
            self.supabase.table("workout_logs")
            .select("weight, reps")
            .eq("user_id", user_id)
            .execute()
        )

        total = 0.0
        for set_data in result.data or []:
            weight = set_data.get("weight", 0) or 0
            reps = set_data.get("reps", 0) or 0
            total += weight * reps

        return total

    async def _get_pr_count(self, user_id: str) -> int:
        """Get total number of PRs achieved"""
        result = (
            self.supabase.table("pr_history")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0

    async def _get_best_1rm(self, user_id: str, exercise_name: str) -> float:
        """Get best 1RM for a specific exercise"""
        # Fuzzy match exercise name (bench press, barbell bench press, etc.)
        result = (
            self.supabase.table("pr_history")
            .select("one_rm")
            .eq("user_id", user_id)
            .ilike("exercise_name", f"%{exercise_name}%")
            .order("one_rm", desc=True)
            .limit(1)
            .execute()
        )

        if result.data and len(result.data) > 0:
            return result.data[0].get("one_rm", 0) or 0
        return 0.0

    async def _get_run_count(self, user_id: str) -> int:
        """Get total number of runs completed"""
        result = (
            self.supabase.table("runs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        return result.count or 0

    async def _get_total_run_distance(self, user_id: str) -> float:
        """Get total distance run in miles (converts from km stored in DB)"""
        result = (
            self.supabase.table("runs")
            .select("distance")
            .eq("user_id", user_id)
            .execute()
        )

        total_km = 0.0
        for run in result.data or []:
            total_km += run.get("distance", 0) or 0

        # Convert km to miles (DB stores in km, badges check in miles)
        return total_km * 0.621371

    async def _get_weather_run_count(self, user_id: str, weather_type: str) -> int:
        """Get count of runs in specific weather conditions"""
        if weather_type == "rain":
            result = (
                self.supabase.table("runs")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .ilike("weather_conditions", "%rain%")
                .execute()
            )
        elif weather_type == "cold":
            result = (
                self.supabase.table("runs")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .lt("temperature_f", 32)
                .execute()
            )
        elif weather_type == "heat":
            result = (
                self.supabase.table("runs")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .gt("temperature_f", 90)
                .execute()
            )
        else:
            return 0

        return result.count or 0

    async def _get_current_workout_streak(self, user_id: str) -> int:
        """
        Get current workout streak (consecutive days with at least 1 workout)
        """
        # Get all workout dates, sorted descending
        result = (
            self.supabase.table("workouts")
            .select("start_time")
            .eq("user_id", user_id)
            .order("start_time", desc=True)
            .execute()
        )

        if not result.data:
            return 0

        # Extract unique dates
        workout_dates = set()
        for workout in result.data:
            workout_date = datetime.fromisoformat(
                workout["start_time"].replace("Z", "+00:00")
            ).date()
            workout_dates.add(workout_date)

        # Sort dates descending
        sorted_dates = sorted(workout_dates, reverse=True)

        # Count consecutive days from today
        today = date.today()
        streak = 0
        expected_date = today

        for workout_date in sorted_dates:
            if workout_date == expected_date:
                streak += 1
                expected_date = expected_date - timedelta(days=1)
            elif workout_date < expected_date:
                # Gap in streak
                break

        return streak

    async def _get_current_run_streak(self, user_id: str) -> int:
        """
        Get current run streak (consecutive days with at least 1 run)
        """
        # Get all run dates, sorted descending
        result = (
            self.supabase.table("runs")
            .select("date")
            .eq("user_id", user_id)
            .order("date", desc=True)
            .execute()
        )

        if not result.data:
            return 0

        # Extract unique dates
        run_dates = set()
        for run in result.data:
            run_date = (
                datetime.fromisoformat(run["date"]).date()
                if isinstance(run["date"], str)
                else run["date"]
            )
            run_dates.add(run_date)

        # Sort dates descending
        sorted_dates = sorted(run_dates, reverse=True)

        # Count consecutive days from today
        today = date.today()
        streak = 0
        expected_date = today

        for run_date in sorted_dates:
            if run_date == expected_date:
                streak += 1
                expected_date = expected_date - timedelta(days=1)
            elif run_date < expected_date:
                # Gap in streak
                break

        return streak

    async def _get_weekly_consistency(self, user_id: str) -> int:
        """
        Get number of consecutive weeks with at least 1 workout
        """
        # Get all workout dates
        result = (
            self.supabase.table("workouts")
            .select("start_time")
            .eq("user_id", user_id)
            .order("start_time", desc=True)
            .execute()
        )

        if not result.data:
            return 0

        # Extract unique week numbers (year, week)
        workout_weeks = set()
        for workout in result.data:
            workout_date = datetime.fromisoformat(
                workout["start_time"].replace("Z", "+00:00")
            ).date()
            year, week, _ = workout_date.isocalendar()
            workout_weeks.add((year, week))

        # Sort weeks descending
        sorted_weeks = sorted(workout_weeks, reverse=True)

        # Count consecutive weeks from current week
        today = date.today()
        current_year, current_week, _ = today.isocalendar()

        streak = 0
        expected_year, expected_week = current_year, current_week

        for year, week in sorted_weeks:
            if (year, week) == (expected_year, expected_week):
                streak += 1
                # Move to previous week
                temp_date = date.fromisocalendar(
                    expected_year, expected_week, 1
                ) - timedelta(days=7)
                expected_year, expected_week, _ = temp_date.isocalendar()
            elif (year, week) < (expected_year, expected_week):
                # Gap in weekly consistency
                break

        return streak

    async def _get_programs_completed(self, user_id: str) -> int:
        """Get number of completed 12-week programs"""
        result = (
            self.supabase.table("generated_programs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .execute()
        )
        return result.count or 0

    # ============================================================================
    # PUBLIC API METHODS
    # ============================================================================

    async def get_user_badges(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all badges earned by user"""
        result = (
            self.supabase.table("user_badges")
            .select("*")
            .eq("user_id", user_id)
            .order("earned_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_badge_progress(self, user_id: str) -> Dict[str, Any]:
        """
        Get progress toward all unearned badges

        Returns:
            Dictionary with badge_type as key and progress info as value
        """
        # Get earned badges
        earned_result = (
            self.supabase.table("user_badges")
            .select("badge_type")
            .eq("user_id", user_id)
            .execute()
        )

        earned_types = {badge["badge_type"] for badge in (earned_result.data or [])}

        # Calculate progress for unearned badges
        progress = {}

        # Workout count progress
        workout_count = await self._get_workout_count(user_id)
        for milestone in [1, 5, 10, 25, 50, 100, 250, 500, 1000]:
            badge_type = f"workout_count_{milestone}"
            if badge_type not in earned_types:
                progress[badge_type] = {
                    "current": workout_count,
                    "required": milestone,
                    "percentage": min(100, int((workout_count / milestone) * 100)),
                }

        # PR count progress
        pr_count = await self._get_pr_count(user_id)
        for milestone in [1, 5, 10, 25, 50, 100, 250, 500]:
            badge_type = f"pr_count_{milestone}"
            if badge_type not in earned_types:
                progress[badge_type] = {
                    "current": pr_count,
                    "required": milestone,
                    "percentage": min(100, int((pr_count / milestone) * 100)),
                }

        # Total run distance progress
        total_miles = await self._get_total_run_distance(user_id)
        for miles in [1, 10, 50, 100, 250, 500, 1000, 2500]:
            badge_type = f"run_distance_total_{miles}"
            if badge_type not in earned_types:
                progress[badge_type] = {
                    "current": round(total_miles, 1),
                    "required": miles,
                    "percentage": min(100, int((total_miles / miles) * 100)),
                }

        return progress

    def get_badge_definition(self, badge_type: str) -> Optional[BadgeDefinition]:
        """Get badge definition by type"""
        return self.badges.get(badge_type)
