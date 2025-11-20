"""
Wearables Ingestion Service

Provider-agnostic ingestion layer for wearable data from:
- Terra (aggregator)
- WHOOP (direct)
- Garmin (direct)
- Apple Health / Google Fit (via Terra or direct)
- Oura (direct)

Handles webhooks and scheduled pulls, normalizes data into daily_metrics and daily_nutrition_summary.
"""

import os
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from supabase import Client
import json
from data_normalization_service import DataNormalizationService
from data_priority_service import DataPriorityService


class WearablesIngestionService:
    """Provider-agnostic wearables data ingestion"""

    # Source priority for each metric type (higher priority = preferred source)
    METRIC_PRIORITY = {
        "sleep_duration": ["whoop", "oura", "garmin", "apple_health", "google_fit"],
        "sleep_quality": ["whoop", "oura", "garmin", "apple_health"],
        "hrv": ["whoop", "oura", "garmin", "apple_health"],
        "resting_hr": ["whoop", "garmin", "oura", "apple_health"],
        "recovery_score": ["whoop", "oura"],
        "strain": ["whoop", "garmin"],
        "steps": ["garmin", "apple_health", "google_fit", "whoop"],
        "calories_burned": ["garmin", "whoop", "apple_health", "google_fit"],
        "active_minutes": ["garmin", "whoop", "apple_health", "google_fit"],
    }

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.normalization_service = DataNormalizationService()
        self.priority_service = DataPriorityService(supabase)

    def ingest_webhook(
        self, user_id: str, provider: str, event_type: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ingest data from a webhook

        Args:
            user_id: User ID
            provider: Provider name (terra|whoop|garmin|apple_health|oura)
            event_type: Event type (sleep|activity|workout|body|nutrition)
            payload: Raw webhook payload

        Returns:
            Ingestion result with processed metrics
        """
        try:
            # Store raw event
            raw_event = self._store_raw_event(user_id, provider, event_type, payload)

            # Parse and normalize based on provider
            normalized_data = self._normalize_payload(provider, event_type, payload)

            # Upsert into daily_metrics and daily_nutrition_summary
            metrics_stored = []
            nutrition_stored = None

            if normalized_data.get("metrics"):
                metrics_stored = self._upsert_daily_metrics(
                    user_id, normalized_data["date"], provider, normalized_data["metrics"]
                )

            if normalized_data.get("nutrition"):
                nutrition_stored = self._upsert_nutrition_summary(
                    user_id, normalized_data["date"], provider, normalized_data["nutrition"]
                )

            # Mark raw event as processed
            self._mark_event_processed(raw_event["id"])

            return {
                "success": True,
                "raw_event_id": raw_event["id"],
                "metrics_stored": len(metrics_stored),
                "nutrition_stored": nutrition_stored is not None,
            }

        except Exception as e:
            print(f"Error ingesting webhook: {e}")
            # Mark event as failed
            if "raw_event" in locals():
                self._mark_event_failed(raw_event["id"], str(e))
            return {"success": False, "error": str(e)}

    def _store_raw_event(
        self, user_id: str, provider: str, event_type: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Store raw webhook event for audit trail"""
        result = (
            self.supabase.table("wearable_raw_events")
            .insert(
                {
                    "user_id": user_id,
                    "provider": provider,
                    "event_type": event_type,
                    "payload_json": payload,
                    "processing_status": "pending",
                }
            )
            .execute()
        )

        return result.data[0] if result.data else {}

    def _normalize_payload(
        self, provider: str, event_type: str, payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Normalize provider-specific payload into standard format

        Returns:
            {
                "date": "2025-01-19",
                "metrics": [{"type": "sleep_duration", "value": 7.5, "quality": 0.95}, ...],
                "nutrition": {"calories": 2500, "protein_g": 150, ...}
            }
        """
        if provider == "terra":
            return self._normalize_terra(event_type, payload)
        elif provider == "whoop":
            return self._normalize_whoop(event_type, payload)
        elif provider == "garmin":
            return self._normalize_garmin(event_type, payload)
        elif provider == "oura":
            return self._normalize_oura(event_type, payload)
        else:
            # Generic fallback
            return {"date": str(date.today()), "metrics": [], "nutrition": None}

    def _normalize_terra(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Terra webhook payload"""
        # Terra provides standardized format
        data = payload.get("data", {})
        event_date = data.get("date", str(date.today()))

        metrics = []
        nutrition = None

        if event_type == "sleep":
            sleep_data = data.get("sleep", {})
            if sleep_data.get("duration_seconds"):
                metrics.append({
                    "type": "sleep_duration",
                    "value": sleep_data["duration_seconds"] / 3600,  # Convert to hours
                    "quality": 0.9,  # Terra provides high-quality data
                })
            if sleep_data.get("hrv_avg"):
                metrics.append({"type": "hrv", "value": sleep_data["hrv_avg"], "quality": 0.9})

        elif event_type == "activity":
            activity_data = data.get("activity", {})
            if activity_data.get("steps"):
                metrics.append({"type": "steps", "value": activity_data["steps"], "quality": 0.9})
            if activity_data.get("calories_burned"):
                metrics.append({
                    "type": "calories_burned",
                    "value": activity_data["calories_burned"],
                    "quality": 0.9,
                })

        elif event_type == "nutrition":
            nutrition_data = data.get("nutrition", {})
            nutrition = {
                "calories": nutrition_data.get("calories"),
                "protein_g": nutrition_data.get("protein_g"),
                "carbs_g": nutrition_data.get("carbs_g"),
                "fat_g": nutrition_data.get("fat_g"),
            }

        return {"date": event_date, "metrics": metrics, "nutrition": nutrition}

    def _normalize_whoop(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize WHOOP webhook payload"""
        # WHOOP-specific normalization
        # TODO: Implement based on WHOOP API documentation
        return {"date": str(date.today()), "metrics": [], "nutrition": None}

    def _normalize_garmin(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Garmin webhook payload"""
        # Garmin-specific normalization
        # TODO: Implement based on Garmin API documentation
        return {"date": str(date.today()), "metrics": [], "nutrition": None}

    def _normalize_oura(self, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Oura webhook payload"""
        # Oura-specific normalization
        # TODO: Implement based on Oura API documentation
        return {"date": str(date.today()), "metrics": [], "nutrition": None}

    def _upsert_daily_metrics(
        self, user_id: str, metric_date: str, source: str, metrics: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Upsert metrics into daily_metrics table with source priority

        Args:
            user_id: User ID
            metric_date: Date (YYYY-MM-DD)
            source: Provider name
            metrics: List of {"type": str, "value": float, "quality": float}

        Returns:
            List of stored metrics
        """
        stored_metrics = []

        for metric in metrics:
            metric_type = metric["type"]
            value = metric["value"]
            quality = metric.get("quality", 0.8)

            # Check if we should store this metric based on source priority
            should_store = self._should_store_metric(
                user_id, metric_date, metric_type, source, quality
            )

            if should_store:
                # Upsert metric
                result = (
                    self.supabase.table("daily_metrics")
                    .upsert(
                        {
                            "user_id": user_id,
                            "date": metric_date,
                            "metric_type": metric_type,
                            "source": source,
                            "value_numeric": value,
                            "quality_score": quality,
                            "updated_at": datetime.now().isoformat(),
                        },
                        on_conflict="user_id,date,metric_type,source",
                    )
                    .execute()
                )

                if result.data:
                    stored_metrics.append(result.data[0])

        return stored_metrics

    def _should_store_metric(
        self, user_id: str, metric_date: str, metric_type: str, source: str, quality: float
    ) -> bool:
        """
        Determine if metric should be stored based on source priority

        Returns True if:
        - No existing metric for this type/date
        - Source has higher priority than existing source
        - Source has same priority but higher quality score
        """
        # Get priority list for this metric type
        priority_list = self.METRIC_PRIORITY.get(metric_type, [])

        if not priority_list or source not in priority_list:
            # Unknown metric type or source - store it anyway
            return True

        source_priority = priority_list.index(source)

        # Check existing metrics for this type/date
        existing = (
            self.supabase.table("daily_metrics")
            .select("source, quality_score")
            .eq("user_id", user_id)
            .eq("date", metric_date)
            .eq("metric_type", metric_type)
            .execute()
        )

        if not existing.data:
            # No existing metric - store it
            return True

        # Check if any existing source has higher priority
        for existing_metric in existing.data:
            existing_source = existing_metric["source"]
            existing_quality = existing_metric.get("quality_score", 0.5)

            if existing_source in priority_list:
                existing_priority = priority_list.index(existing_source)

                if existing_priority < source_priority:
                    # Existing source has higher priority - don't store
                    return False
                elif existing_priority == source_priority and existing_quality >= quality:
                    # Same priority but existing has better quality - don't store
                    return False

        return True

    def _upsert_nutrition_summary(
        self, user_id: str, summary_date: str, source: str, nutrition: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Upsert nutrition summary"""
        if not nutrition:
            return None

        result = (
            self.supabase.table("daily_nutrition_summary")
            .upsert(
                {
                    "user_id": user_id,
                    "date": summary_date,
                    "source": source,
                    "calories": nutrition.get("calories"),
                    "protein_g": nutrition.get("protein_g"),
                    "carbs_g": nutrition.get("carbs_g"),
                    "fat_g": nutrition.get("fat_g"),
                    "fiber_g": nutrition.get("fiber_g"),
                    "sugar_g": nutrition.get("sugar_g"),
                    "sodium_mg": nutrition.get("sodium_mg"),
                    "water_ml": nutrition.get("water_ml"),
                    "updated_at": datetime.now().isoformat(),
                },
                on_conflict="user_id,date,source",
            )
            .execute()
        )

        return result.data[0] if result.data else None

    def _mark_event_processed(self, event_id: str):
        """Mark raw event as successfully processed"""
        self.supabase.table("wearable_raw_events").update(
            {"processing_status": "processed", "processed_at": datetime.now().isoformat()}
        ).eq("id", event_id).execute()

    def _mark_event_failed(self, event_id: str, error_message: str):
        """Mark raw event as failed"""
        self.supabase.table("wearable_raw_events").update(
            {
                "processing_status": "failed",
                "error_message": error_message,
                "processed_at": datetime.now().isoformat(),
            }
        ).eq("id", event_id).execute()

    # ============================================================================
    # New Schema Methods (health_metrics, sleep_sessions, activity_sessions)
    # ============================================================================

    def ingest_terra_sleep(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest Terra sleep webhook into sleep_sessions table.

        Args:
            user_id: User ID
            payload: Terra sleep webhook payload

        Returns:
            Ingestion result
        """
        try:
            # Normalize payload
            normalized = self.normalization_service.normalize_terra_sleep(payload)
            normalized['user_id'] = user_id

            # Insert into sleep_sessions
            result = self.supabase.table('sleep_sessions').insert(normalized).execute()

            return {'success': True, 'session_id': result.data[0]['id'] if result.data else None}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def ingest_terra_activity(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest Terra activity webhook into activity_sessions table.

        Args:
            user_id: User ID
            payload: Terra activity webhook payload

        Returns:
            Ingestion result
        """
        try:
            # Normalize payload
            normalized = self.normalization_service.normalize_terra_activity(payload)
            normalized['user_id'] = user_id

            # Insert into activity_sessions
            result = self.supabase.table('activity_sessions').insert(normalized).execute()

            return {'success': True, 'session_id': result.data[0]['id'] if result.data else None}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def ingest_whoop_recovery(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest WHOOP recovery webhook into health_metrics table.

        Args:
            user_id: User ID
            payload: WHOOP recovery webhook payload

        Returns:
            Ingestion result
        """
        try:
            # Normalize payload
            metrics = self.normalization_service.normalize_whoop_recovery(payload)

            # Insert each metric with priority handling
            inserted = []
            for metric in metrics:
                metric['user_id'] = user_id

                # Check priority
                decision = self.priority_service.resolve_metric_conflict(
                    user_id=user_id,
                    metric_date=metric['date'],
                    metric_type=metric['metric_type'],
                    new_value=metric['value_numeric'],
                    new_source=metric['source']
                )

                if decision['action'] == 'insert':
                    result = self.supabase.table('health_metrics').insert(metric).execute()
                    inserted.append(result.data[0] if result.data else None)
                elif decision['action'] == 'update':
                    result = self.supabase.table('health_metrics').update(metric).eq(
                        'id', decision['existing_id']
                    ).execute()
                    inserted.append(result.data[0] if result.data else None)

            return {'success': True, 'metrics_inserted': len(inserted)}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def ingest_whoop_sleep(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest WHOOP sleep webhook into sleep_sessions table.

        Args:
            user_id: User ID
            payload: WHOOP sleep webhook payload

        Returns:
            Ingestion result
        """
        try:
            # Normalize payload
            normalized = self.normalization_service.normalize_whoop_sleep(payload)
            normalized['user_id'] = user_id

            # Insert into sleep_sessions
            result = self.supabase.table('sleep_sessions').insert(normalized).execute()

            return {'success': True, 'session_id': result.data[0]['id'] if result.data else None}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def ingest_whoop_workout(self, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingest WHOOP workout webhook into activity_sessions table.

        Args:
            user_id: User ID
            payload: WHOOP workout webhook payload

        Returns:
            Ingestion result
        """
        try:
            # Normalize payload
            normalized = self.normalization_service.normalize_whoop_workout(payload)
            normalized['user_id'] = user_id

            # Insert into activity_sessions
            result = self.supabase.table('activity_sessions').insert(normalized).execute()

            return {'success': True, 'session_id': result.data[0]['id'] if result.data else None}
        except Exception as e:
            return {'success': False, 'error': str(e)}

