"""
Stryd Integration Service

Integrates Stryd power data for running mechanics and training load analysis:
- OAuth 2.0 connection flow
- Power data fetching and normalization
- Running mechanics analysis
- Training load correlation with shoe selection and surface type
- Injury risk correlation with running metrics
"""

import os
import requests
from typing import Any, Dict, List, Optional
from supabase import Client
from datetime import datetime, timedelta


class StrydService:
    """Stryd power meter integration"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client_id = os.getenv("STRYD_CLIENT_ID")
        self.client_secret = os.getenv("STRYD_CLIENT_SECRET")
        self.redirect_uri = os.getenv("STRYD_REDIRECT_URI", "voicefit://stryd-callback")
        self.api_base = "https://api.stryd.com/v1"

    def get_oauth_url(self, state: str) -> str:
        """Get Stryd OAuth authorization URL"""
        return (
            f"https://app.stryd.com/oauth/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"state={state}"
        )

    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token"""
        try:
            response = requests.post(
                "https://app.stryd.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                },
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return {"error": str(e)}

    def get_power_data(
        self,
        user_id: str,
        access_token: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fetch power data from Stryd"""
        try:
            if not start_date:
                start_date = (datetime.now() - timedelta(days=7)).isoformat()
            if not end_date:
                end_date = datetime.now().isoformat()

            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(
                f"{self.api_base}/activities",
                headers=headers,
                params={"start_date": start_date, "end_date": end_date},
            )
            response.raise_for_status()
            activities = response.json()

            # Normalize and store power data
            normalized_data = []
            for activity in activities:
                normalized = self._normalize_power_data(activity)
                normalized_data.append(normalized)
                self._store_power_data(user_id, normalized)

            return {
                "success": True,
                "activities_count": len(activities),
                "data": normalized_data,
            }
        except Exception as e:
            print(f"Error fetching power data: {e}")
            return {"error": str(e)}

    def analyze_running_mechanics(
        self,
        user_id: str,
        activity_id: str,
        access_token: str,
    ) -> Dict[str, Any]:
        """Analyze running mechanics from power data"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(
                f"{self.api_base}/activities/{activity_id}",
                headers=headers,
            )
            response.raise_for_status()
            activity = response.json()

            # Extract metrics
            metrics = {
                "power_avg": activity.get("power_avg"),
                "power_max": activity.get("power_max"),
                "cadence_avg": activity.get("cadence_avg"),
                "ground_contact_time": activity.get("ground_contact_time"),
                "vertical_oscillation": activity.get("vertical_oscillation"),
                "leg_spring_stiffness": activity.get("leg_spring_stiffness"),
                "efficiency": self._calculate_efficiency(activity),
            }

            return {
                "success": True,
                "activity_id": activity_id,
                "metrics": metrics,
                "analysis": self._generate_mechanics_analysis(metrics),
            }
        except Exception as e:
            print(f"Error analyzing mechanics: {e}")
            return {"error": str(e)}

    def correlate_with_shoe_and_surface(
        self,
        user_id: str,
        activity_id: str,
    ) -> Dict[str, Any]:
        """Correlate power data with shoe selection and surface type"""
        try:
            # Fetch activity power data
            power_result = self.supabase.table("stryd_power_data").select("*").eq(
                "activity_id", activity_id
            ).single().execute()
            
            power_data = power_result.data if power_result.data else {}

            # Fetch shoe data for this run
            shoe_result = self.supabase.table("runs").select("shoe_id").eq(
                "activity_id", activity_id
            ).single().execute()
            
            shoe_id = shoe_result.data.get("shoe_id") if shoe_result.data else None

            # Fetch shoe details
            shoe_data = {}
            if shoe_id:
                shoe_result = self.supabase.table("running_shoes").select("*").eq(
                    "id", shoe_id
                ).single().execute()
                shoe_data = shoe_result.data if shoe_result.data else {}

            return {
                "success": True,
                "activity_id": activity_id,
                "power_metrics": power_data,
                "shoe": shoe_data,
                "correlation": self._analyze_shoe_power_correlation(power_data, shoe_data),
            }
        except Exception as e:
            print(f"Error correlating data: {e}")
            return {"error": str(e)}

    def get_training_load_analysis(
        self,
        user_id: str,
        days: int = 7,
    ) -> Dict[str, Any]:
        """Analyze training load over time"""
        try:
            # Fetch recent power data
            result = self.supabase.table("stryd_power_data").select("*").eq(
                "user_id", user_id
            ).gte("created_at", (datetime.now() - timedelta(days=days)).isoformat()).execute()
            
            activities = result.data if result.data else []

            # Calculate training load metrics
            total_power = sum(a.get("power_avg", 0) * a.get("duration_minutes", 0) for a in activities)
            avg_power = sum(a.get("power_avg", 0) for a in activities) / len(activities) if activities else 0
            max_power = max((a.get("power_max", 0) for a in activities), default=0)

            return {
                "success": True,
                "period_days": days,
                "activities_count": len(activities),
                "total_power_load": total_power,
                "avg_power": avg_power,
                "max_power": max_power,
                "training_load_trend": self._calculate_load_trend(activities),
            }
        except Exception as e:
            print(f"Error analyzing training load: {e}")
            return {"error": str(e)}

    def _normalize_power_data(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Stryd power data"""
        return {
            "activity_id": activity.get("id"),
            "power_avg": activity.get("power_avg"),
            "power_max": activity.get("power_max"),
            "power_normalized": activity.get("power_normalized"),
            "cadence_avg": activity.get("cadence_avg"),
            "ground_contact_time": activity.get("ground_contact_time"),
            "vertical_oscillation": activity.get("vertical_oscillation"),
            "leg_spring_stiffness": activity.get("leg_spring_stiffness"),
            "duration_minutes": activity.get("duration_minutes"),
            "distance_km": activity.get("distance_km"),
            "timestamp": activity.get("timestamp"),
        }

    def _store_power_data(self, user_id: str, data: Dict[str, Any]) -> None:
        """Store normalized power data"""
        try:
            self.supabase.table("stryd_power_data").insert(
                {
                    "user_id": user_id,
                    **data,
                    "created_at": datetime.now().isoformat(),
                }
            ).execute()
        except Exception as e:
            print(f"Error storing power data: {e}")

    def _calculate_efficiency(self, activity: Dict[str, Any]) -> float:
        """Calculate running efficiency (power per pace)"""
        power = activity.get("power_avg", 0)
        pace = activity.get("pace_avg", 1)
        return power / pace if pace > 0 else 0

    def _generate_mechanics_analysis(self, metrics: Dict[str, Any]) -> str:
        """Generate analysis of running mechanics"""
        analysis = []
        
        if metrics.get("ground_contact_time", 0) > 300:
            analysis.append("High ground contact time - focus on cadence")
        if metrics.get("vertical_oscillation", 0) > 10:
            analysis.append("High vertical oscillation - improve running form")
        if metrics.get("efficiency", 0) > 5:
            analysis.append("Good efficiency - maintain current form")
        
        return " | ".join(analysis) if analysis else "Running mechanics within normal range"

    def _analyze_shoe_power_correlation(
        self,
        power_data: Dict[str, Any],
        shoe_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Analyze correlation between shoe and power metrics"""
        return {
            "shoe_type": shoe_data.get("shoe_type"),
            "power_efficiency": "Good" if power_data.get("power_avg", 0) < 300 else "High",
            "recommendation": "Consider shoe rotation if power is consistently high",
        }

    def _calculate_load_trend(self, activities: List[Dict[str, Any]]) -> str:
        """Calculate training load trend"""
        if len(activities) < 2:
            return "Insufficient data"
        
        recent_avg = sum(a.get("power_avg", 0) for a in activities[-3:]) / min(3, len(activities))
        earlier_avg = sum(a.get("power_avg", 0) for a in activities[:-3]) / max(1, len(activities) - 3)
        
        if recent_avg > earlier_avg * 1.1:
            return "Increasing"
        elif recent_avg < earlier_avg * 0.9:
            return "Decreasing"
        else:
            return "Stable"

