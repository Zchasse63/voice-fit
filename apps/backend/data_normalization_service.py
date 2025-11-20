"""
Data Normalization Service
Normalizes wearable data from different providers (Terra, WHOOP, Garmin, Apple Health, Oura)
into our unified schema.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date
from decimal import Decimal


class DataNormalizationService:
    """Service to normalize wearable data from different formats into our schema."""
    
    def __init__(self):
        """Initialize the data normalization service."""
        pass
    
    # ============================================================================
    # Terra API Normalization
    # ============================================================================
    
    def normalize_terra_sleep(self, terra_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize Terra sleep webhook payload to our sleep_sessions schema.
        
        Args:
            terra_payload: Raw Terra sleep webhook payload
            
        Returns:
            Normalized sleep session data
        """
        data = terra_payload.get('data', {})
        
        return {
            'start_time': data.get('start_time'),
            'end_time': data.get('end_time'),
            'total_duration_minutes': data.get('duration_asleep_state_seconds', 0) // 60,
            'light_sleep_minutes': data.get('duration_light_sleep_state_seconds', 0) // 60,
            'deep_sleep_minutes': data.get('duration_deep_sleep_state_seconds', 0) // 60,
            'rem_sleep_minutes': data.get('duration_REM_sleep_state_seconds', 0) // 60,
            'awake_minutes': data.get('duration_awake_state_seconds', 0) // 60,
            'sleep_score': data.get('score'),
            'sleep_efficiency': data.get('efficiency'),
            'avg_heart_rate': data.get('average_hr_bpm'),
            'avg_hrv': data.get('average_hrv_rmssd'),
            'avg_respiratory_rate': data.get('average_breathing_rate'),
            'avg_spo2': data.get('average_spo2_percentage'),
            'source': 'terra',
            'source_id': data.get('id'),
            'metadata': {
                'provider': terra_payload.get('provider'),
                'raw_score': data.get('score_data', {})
            }
        }
    
    def normalize_terra_activity(self, terra_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize Terra activity webhook payload to our activity_sessions schema.
        
        Args:
            terra_payload: Raw Terra activity webhook payload
            
        Returns:
            Normalized activity session data
        """
        data = terra_payload.get('data', {})
        
        return {
            'start_time': data.get('start_time'),
            'end_time': data.get('end_time'),
            'duration_minutes': data.get('duration_seconds', 0) // 60,
            'activity_type': data.get('activity_type', '').lower(),
            'distance_meters': data.get('distance_meters'),
            'calories_burned': data.get('active_calories'),
            'avg_heart_rate': data.get('average_hr_bpm'),
            'max_heart_rate': data.get('max_hr_bpm'),
            'strain_score': data.get('strain'),
            'source': 'terra',
            'source_id': data.get('id'),
            'metadata': {
                'provider': terra_payload.get('provider'),
                'elevation_gain': data.get('elevation_gain_meters'),
                'steps': data.get('steps')
            }
        }
    
    def normalize_terra_body(self, terra_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Normalize Terra body webhook payload to our health_metrics schema.
        
        Args:
            terra_payload: Raw Terra body webhook payload
            
        Returns:
            List of normalized health metrics
        """
        data = terra_payload.get('data', {})
        metrics = []
        metric_date = datetime.fromisoformat(data.get('timestamp', datetime.now().isoformat())).date()
        
        # Weight
        if data.get('weight_kg'):
            metrics.append({
                'date': metric_date,
                'metric_type': 'weight',
                'value_numeric': Decimal(str(data['weight_kg'])),
                'source': 'terra',
                'source_priority': 55,
                'recorded_at': data.get('timestamp'),
                'metadata': {'provider': terra_payload.get('provider')}
            })
        
        # Body fat percentage
        if data.get('body_fat_percentage'):
            metrics.append({
                'date': metric_date,
                'metric_type': 'body_fat_percentage',
                'value_numeric': Decimal(str(data['body_fat_percentage'])),
                'source': 'terra',
                'source_priority': 55,
                'recorded_at': data.get('timestamp'),
                'metadata': {'provider': terra_payload.get('provider')}
            })
        
        # BMI
        if data.get('BMI'):
            metrics.append({
                'date': metric_date,
                'metric_type': 'bmi',
                'value_numeric': Decimal(str(data['BMI'])),
                'source': 'terra',
                'source_priority': 55,
                'recorded_at': data.get('timestamp'),
                'metadata': {'provider': terra_payload.get('provider')}
            })
        
        return metrics
    
    def normalize_terra_daily(self, terra_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize Terra daily webhook payload to our daily_summaries schema.
        
        Args:
            terra_payload: Raw Terra daily webhook payload
            
        Returns:
            Normalized daily summary data
        """
        data = terra_payload.get('data', {})
        summary_date = datetime.fromisoformat(data.get('start_time', datetime.now().isoformat())).date()
        
        return {
            'date': summary_date,
            'steps': data.get('steps'),
            'active_minutes': data.get('active_duration_seconds', 0) // 60,
            'calories_total': data.get('total_calories'),
            'calories_active': data.get('active_calories'),
            'distance_meters': data.get('distance_meters'),
            'sources': ['terra'],
            'metadata': {
                'provider': terra_payload.get('provider'),
                'floors_climbed': data.get('floors_climbed')
            }
        }

    # ============================================================================
    # WHOOP API Normalization
    # ============================================================================

    def normalize_whoop_recovery(self, whoop_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Normalize WHOOP recovery webhook payload to our health_metrics schema.

        Args:
            whoop_payload: Raw WHOOP recovery webhook payload

        Returns:
            List of normalized health metrics
        """
        metrics = []
        recovery_date = datetime.fromisoformat(whoop_payload.get('created_at', datetime.now().isoformat())).date()

        # Recovery score
        if whoop_payload.get('score', {}).get('recovery_score') is not None:
            metrics.append({
                'date': recovery_date,
                'metric_type': 'recovery_score',
                'value_numeric': Decimal(str(whoop_payload['score']['recovery_score'])),
                'source': 'whoop',
                'source_priority': 100,  # WHOOP has highest priority for recovery
                'recorded_at': whoop_payload.get('created_at'),
                'metadata': whoop_payload.get('score', {})
            })

        # Resting heart rate
        if whoop_payload.get('score', {}).get('resting_heart_rate'):
            metrics.append({
                'date': recovery_date,
                'metric_type': 'resting_hr',
                'value_numeric': Decimal(str(whoop_payload['score']['resting_heart_rate'])),
                'source': 'whoop',
                'source_priority': 100,
                'recorded_at': whoop_payload.get('created_at'),
                'metadata': {}
            })

        # HRV
        if whoop_payload.get('score', {}).get('hrv_rmssd_milli'):
            metrics.append({
                'date': recovery_date,
                'metric_type': 'hrv',
                'value_numeric': Decimal(str(whoop_payload['score']['hrv_rmssd_milli'])),
                'source': 'whoop',
                'source_priority': 100,
                'recorded_at': whoop_payload.get('created_at'),
                'metadata': {}
            })

        # Respiratory rate
        if whoop_payload.get('score', {}).get('spo2_percentage'):
            metrics.append({
                'date': recovery_date,
                'metric_type': 'spo2',
                'value_numeric': Decimal(str(whoop_payload['score']['spo2_percentage'])),
                'source': 'whoop',
                'source_priority': 100,
                'recorded_at': whoop_payload.get('created_at'),
                'metadata': {}
            })

        # Skin temperature
        if whoop_payload.get('score', {}).get('skin_temp_celsius'):
            metrics.append({
                'date': recovery_date,
                'metric_type': 'skin_temp',
                'value_numeric': Decimal(str(whoop_payload['score']['skin_temp_celsius'])),
                'source': 'whoop',
                'source_priority': 100,
                'recorded_at': whoop_payload.get('created_at'),
                'metadata': {}
            })

        return metrics

    def normalize_whoop_sleep(self, whoop_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize WHOOP sleep webhook payload to our sleep_sessions schema.

        Args:
            whoop_payload: Raw WHOOP sleep webhook payload

        Returns:
            Normalized sleep session data
        """
        return {
            'start_time': whoop_payload.get('start'),
            'end_time': whoop_payload.get('end'),
            'total_duration_minutes': whoop_payload.get('score', {}).get('total_sleep_time_milli', 0) // 60000,
            'light_sleep_minutes': whoop_payload.get('score', {}).get('stage_summary', {}).get('total_light_sleep_time_milli', 0) // 60000,
            'deep_sleep_minutes': whoop_payload.get('score', {}).get('stage_summary', {}).get('total_slow_wave_sleep_time_milli', 0) // 60000,
            'rem_sleep_minutes': whoop_payload.get('score', {}).get('stage_summary', {}).get('total_rem_sleep_time_milli', 0) // 60000,
            'awake_minutes': whoop_payload.get('score', {}).get('stage_summary', {}).get('total_awake_time_milli', 0) // 60000,
            'sleep_score': whoop_payload.get('score', {}).get('sleep_performance_percentage'),
            'sleep_efficiency': whoop_payload.get('score', {}).get('sleep_efficiency_percentage'),
            'latency_minutes': whoop_payload.get('score', {}).get('latency_milli', 0) // 60000,
            'avg_heart_rate': whoop_payload.get('score', {}).get('average_heart_rate'),
            'avg_hrv': whoop_payload.get('score', {}).get('average_hrv'),
            'avg_respiratory_rate': whoop_payload.get('score', {}).get('respiratory_rate'),
            'source': 'whoop',
            'source_id': whoop_payload.get('id'),
            'metadata': whoop_payload.get('score', {})
        }

    def normalize_whoop_workout(self, whoop_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize WHOOP workout webhook payload to our activity_sessions schema.

        Args:
            whoop_payload: Raw WHOOP workout webhook payload

        Returns:
            Normalized activity session data
        """
        return {
            'start_time': whoop_payload.get('start'),
            'end_time': whoop_payload.get('end'),
            'duration_minutes': whoop_payload.get('score', {}).get('duration_milli', 0) // 60000,
            'activity_type': whoop_payload.get('sport_id', 'unknown'),
            'calories_burned': whoop_payload.get('score', {}).get('kilojoule', 0) // 4.184,  # Convert kJ to kcal
            'avg_heart_rate': whoop_payload.get('score', {}).get('average_heart_rate'),
            'max_heart_rate': whoop_payload.get('score', {}).get('max_heart_rate'),
            'strain_score': whoop_payload.get('score', {}).get('strain'),
            'source': 'whoop',
            'source_id': whoop_payload.get('id'),
            'metadata': whoop_payload.get('score', {})
        }

