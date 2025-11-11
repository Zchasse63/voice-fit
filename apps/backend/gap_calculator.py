"""
Grade-Adjusted Pace (GAP) Calculator for VoiceFit

Calculates grade-adjusted pace for running workouts based on elevation changes.
GAP normalizes pace to account for hills, allowing fair comparison between runs.

Formula: GAP = Actual Pace × (1 - 0.075 × Grade%)
Where Grade% = (Elevation Change / Distance) × 100
"""

from typing import Dict, Any, Optional


class GAPCalculator:
    """
    Calculator for Grade-Adjusted Pace (GAP).
    
    GAP adjusts running pace to account for elevation changes, making it easier
    to compare runs on different terrain. A run with significant elevation gain
    will have a faster GAP than actual pace, reflecting the extra effort.
    
    Research basis:
    - Formula from running science research
    - 7.5% pace adjustment per 1% grade is widely accepted
    - Used by Strava, Garmin, and other running platforms
    """
    
    @staticmethod
    def calculate_gap(
        actual_pace: float,
        elevation_gain: float,
        elevation_loss: float,
        distance: float,
        pace_unit: str = "min_per_km"
    ) -> Dict[str, Any]:
        """
        Calculate grade-adjusted pace for a run.
        
        Args:
            actual_pace: Actual pace in minutes per km or minutes per mile
            elevation_gain: Total elevation gain in meters
            elevation_loss: Total elevation loss in meters
            distance: Total distance in kilometers or miles (must match pace_unit)
            pace_unit: "min_per_km" or "min_per_mile"
        
        Returns:
            Dict with GAP calculation results:
            {
                "gap": 5.2,  # Grade-adjusted pace
                "actual_pace": 5.5,  # Original pace
                "grade_percent": 2.3,  # Average grade
                "net_elevation_change": 150,  # meters
                "adjustment_percent": 7.5,  # Pace adjustment
                "pace_unit": "min_per_km",
                "difficulty": "moderate_uphill"  # Terrain difficulty
            }
        """
        # Handle edge cases
        if distance <= 0:
            return GAPCalculator._get_fallback_gap(actual_pace, pace_unit)
        
        # Calculate net elevation change (gain - loss)
        net_elevation_change = elevation_gain - elevation_loss
        
        # Convert distance to meters for grade calculation
        if pace_unit == "min_per_mile":
            distance_meters = distance * 1609.34  # miles to meters
        else:  # min_per_km
            distance_meters = distance * 1000  # km to meters
        
        # Calculate average grade percentage
        grade_percent = (net_elevation_change / distance_meters) * 100 if distance_meters > 0 else 0
        
        # Calculate pace adjustment
        # Formula: GAP = Actual Pace × (1 - 0.075 × Grade%)
        # Positive grade (uphill) = slower actual pace, faster GAP
        # Negative grade (downhill) = faster actual pace, slower GAP
        adjustment_percent = 0.075 * grade_percent
        
        # Calculate GAP
        gap = actual_pace * (1 - (adjustment_percent / 100))
        
        # Ensure GAP is positive and reasonable
        if gap <= 0:
            gap = actual_pace
        
        # Determine terrain difficulty
        difficulty = GAPCalculator._classify_terrain_difficulty(
            grade_percent,
            elevation_gain,
            distance
        )
        
        return {
            "gap": round(gap, 2),
            "actual_pace": round(actual_pace, 2),
            "grade_percent": round(grade_percent, 2),
            "net_elevation_change": round(net_elevation_change, 1),
            "elevation_gain": round(elevation_gain, 1),
            "elevation_loss": round(elevation_loss, 1),
            "adjustment_percent": round(adjustment_percent, 2),
            "pace_unit": pace_unit,
            "difficulty": difficulty,
            "is_uphill": net_elevation_change > 0,
            "is_downhill": net_elevation_change < 0,
            "is_flat": abs(grade_percent) < 0.5
        }
    
    @staticmethod
    def calculate_gap_from_run_data(run_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate GAP from run data dict (from database or API).
        
        Args:
            run_data: Dict with keys: pace, elevation_gain, elevation_loss, distance
        
        Returns:
            GAP calculation results dict
        """
        actual_pace = run_data.get("pace", 0)
        elevation_gain = run_data.get("elevation_gain", 0)
        elevation_loss = run_data.get("elevation_loss", 0)
        distance = run_data.get("distance", 0)
        
        # Determine pace unit (assume min/km if not specified)
        pace_unit = run_data.get("pace_unit", "min_per_km")
        
        return GAPCalculator.calculate_gap(
            actual_pace=actual_pace,
            elevation_gain=elevation_gain,
            elevation_loss=elevation_loss,
            distance=distance,
            pace_unit=pace_unit
        )
    
    @staticmethod
    def _classify_terrain_difficulty(
        grade_percent: float,
        elevation_gain: float,
        distance: float
    ) -> str:
        """
        Classify terrain difficulty based on grade and elevation.
        
        Returns:
            Difficulty classification:
            - "flat"
            - "rolling" (small hills)
            - "moderate_uphill"
            - "steep_uphill"
            - "very_steep_uphill"
            - "moderate_downhill"
            - "steep_downhill"
        """
        # Flat terrain
        if abs(grade_percent) < 0.5:
            return "flat"
        
        # Uphill terrain
        if grade_percent > 0:
            if grade_percent > 5:
                return "very_steep_uphill"
            elif grade_percent > 3:
                return "steep_uphill"
            elif grade_percent > 1:
                return "moderate_uphill"
            else:
                return "rolling"
        
        # Downhill terrain
        else:
            if grade_percent < -5:
                return "steep_downhill"
            elif grade_percent < -3:
                return "moderate_downhill"
            else:
                return "rolling"
    
    @staticmethod
    def _get_fallback_gap(actual_pace: float, pace_unit: str) -> Dict[str, Any]:
        """
        Return fallback GAP data when calculation is not possible.
        
        Assumes flat terrain (GAP = actual pace).
        """
        return {
            "gap": round(actual_pace, 2),
            "actual_pace": round(actual_pace, 2),
            "grade_percent": 0.0,
            "net_elevation_change": 0.0,
            "elevation_gain": 0.0,
            "elevation_loss": 0.0,
            "adjustment_percent": 0.0,
            "pace_unit": pace_unit,
            "difficulty": "flat",
            "is_uphill": False,
            "is_downhill": False,
            "is_flat": True
        }
    
    @staticmethod
    def compare_runs(run1: Dict[str, Any], run2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare two runs using GAP to account for terrain differences.
        
        Args:
            run1: First run data dict
            run2: Second run data dict
        
        Returns:
            Comparison results:
            {
                "run1_gap": 5.2,
                "run2_gap": 5.5,
                "gap_difference": -0.3,  # run1 is faster
                "faster_run": "run1",
                "pace_difference_actual": 0.2,
                "pace_difference_adjusted": -0.3,
                "terrain_comparison": "run1 had more elevation"
            }
        """
        gap1 = GAPCalculator.calculate_gap_from_run_data(run1)
        gap2 = GAPCalculator.calculate_gap_from_run_data(run2)
        
        gap_difference = gap1["gap"] - gap2["gap"]
        pace_difference_actual = run1.get("pace", 0) - run2.get("pace", 0)
        
        faster_run = "run1" if gap_difference < 0 else "run2"
        
        # Terrain comparison
        elev1 = gap1["elevation_gain"]
        elev2 = gap2["elevation_gain"]
        
        if abs(elev1 - elev2) < 10:
            terrain_comparison = "similar elevation"
        elif elev1 > elev2:
            terrain_comparison = f"run1 had {round(elev1 - elev2, 1)}m more elevation gain"
        else:
            terrain_comparison = f"run2 had {round(elev2 - elev1, 1)}m more elevation gain"
        
        return {
            "run1_gap": gap1["gap"],
            "run2_gap": gap2["gap"],
            "gap_difference": round(gap_difference, 2),
            "faster_run": faster_run,
            "pace_difference_actual": round(pace_difference_actual, 2),
            "pace_difference_adjusted": round(gap_difference, 2),
            "terrain_comparison": terrain_comparison,
            "run1_difficulty": gap1["difficulty"],
            "run2_difficulty": gap2["difficulty"]
        }
    
    @staticmethod
    def format_pace(pace: float, pace_unit: str = "min_per_km") -> str:
        """
        Format pace as MM:SS string.
        
        Args:
            pace: Pace in minutes (e.g., 5.5 = 5:30)
            pace_unit: "min_per_km" or "min_per_mile"
        
        Returns:
            Formatted pace string (e.g., "5:30/km")
        """
        minutes = int(pace)
        seconds = int((pace - minutes) * 60)
        
        unit_suffix = "/km" if pace_unit == "min_per_km" else "/mi"
        
        return f"{minutes}:{seconds:02d}{unit_suffix}"

