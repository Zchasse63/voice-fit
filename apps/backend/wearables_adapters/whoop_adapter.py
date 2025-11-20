"""
WHOOP Direct Integration Adapter

Handles direct integration with WHOOP API for:
- Sleep data (duration, quality, HRV, RHR)
- Recovery scores
- Strain scores
- Workout data

WHOOP is the primary source for sleep, recovery, HRV, and strain metrics.
"""

import os
import requests
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional


class WHOOPAdapter:
    """Direct integration with WHOOP API v2"""

    BASE_URL = "https://api.prod.whoop.com/developer/v1"

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    def get_sleep_data(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Fetch sleep data for date range

        Returns list of sleep records with:
        - date
        - duration_hours
        - sleep_quality_score
        - hrv_avg
        - resting_hr
        - sleep_stages (light, deep, rem, awake)
        """
        try:
            # WHOOP API endpoint for sleep
            url = f"{self.BASE_URL}/activity/sleep"
            params = {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            }

            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            sleep_records = data.get("records", [])

            normalized_sleep = []
            for record in sleep_records:
                sleep_date = record.get("created_at", "").split("T")[0]

                # Extract sleep metrics
                score = record.get("score", {})
                sleep_data = record.get("sleep", {})

                normalized_sleep.append({
                    "date": sleep_date,
                    "duration_hours": sleep_data.get("total_in_bed_time_milli", 0) / 3600000,
                    "sleep_quality_score": score.get("sleep_performance_percentage", 0) / 100,
                    "hrv_avg": record.get("hrv_rmssd_milli", 0) / 1000,  # Convert to seconds
                    "resting_hr": record.get("resting_heart_rate", 0),
                    "sleep_stages": {
                        "light_minutes": sleep_data.get("light_sleep_duration_milli", 0) / 60000,
                        "deep_minutes": sleep_data.get("slow_wave_sleep_duration_milli", 0) / 60000,
                        "rem_minutes": sleep_data.get("rem_sleep_duration_milli", 0) / 60000,
                        "awake_minutes": sleep_data.get("wake_duration_milli", 0) / 60000,
                    },
                })

            return normalized_sleep

        except Exception as e:
            print(f"Error fetching WHOOP sleep data: {e}")
            return []

    def get_recovery_data(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Fetch recovery data for date range

        Returns list of recovery records with:
        - date
        - recovery_score (0-100)
        - hrv_avg
        - resting_hr
        - skin_temp_celsius
        """
        try:
            url = f"{self.BASE_URL}/recovery"
            params = {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            }

            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            recovery_records = data.get("records", [])

            normalized_recovery = []
            for record in recovery_records:
                recovery_date = record.get("created_at", "").split("T")[0]
                score = record.get("score", {})

                normalized_recovery.append({
                    "date": recovery_date,
                    "recovery_score": score.get("recovery_score", 0),
                    "hrv_avg": score.get("hrv_rmssd_milli", 0) / 1000,
                    "resting_hr": score.get("resting_heart_rate", 0),
                    "skin_temp_celsius": score.get("skin_temp_celsius"),
                })

            return normalized_recovery

        except Exception as e:
            print(f"Error fetching WHOOP recovery data: {e}")
            return []

    def get_strain_data(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Fetch strain data for date range

        Returns list of strain records with:
        - date
        - strain_score (0-21)
        - calories_burned
        - avg_hr
        - max_hr
        """
        try:
            url = f"{self.BASE_URL}/cycle"
            params = {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            }

            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            cycle_records = data.get("records", [])

            normalized_strain = []
            for record in cycle_records:
                cycle_date = record.get("created_at", "").split("T")[0]
                score = record.get("score", {})

                normalized_strain.append({
                    "date": cycle_date,
                    "strain_score": score.get("strain", 0),
                    "calories_burned": score.get("kilojoule", 0) / 4.184,  # Convert kJ to kcal
                    "avg_hr": score.get("average_heart_rate", 0),
                    "max_hr": score.get("max_heart_rate", 0),
                })

            return normalized_strain

        except Exception as e:
            print(f"Error fetching WHOOP strain data: {e}")
            return []

    def get_workouts(
        self, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Fetch workout data for date range

        Returns list of workouts with:
        - date
        - sport_name
        - duration_minutes
        - strain_score
        - calories_burned
        - avg_hr
        - max_hr
        """
        try:
            url = f"{self.BASE_URL}/activity/workout"
            params = {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
            }

            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            workout_records = data.get("records", [])

            normalized_workouts = []
            for record in workout_records:
                workout_date = record.get("created_at", "").split("T")[0]
                score = record.get("score", {})

                normalized_workouts.append({
                    "date": workout_date,
                    "sport_name": record.get("sport_name", "Unknown"),
                    "duration_minutes": record.get("duration_milli", 0) / 60000,
                    "strain_score": score.get("strain", 0),
                    "calories_burned": score.get("kilojoule", 0) / 4.184,
                    "avg_hr": score.get("average_heart_rate", 0),
                    "max_hr": score.get("max_heart_rate", 0),
                })

            return normalized_workouts

        except Exception as e:
            print(f"Error fetching WHOOP workouts: {e}")
            return []

