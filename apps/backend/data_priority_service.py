"""
Data Priority Service
Handles conflicts when multiple wearable sources provide the same metric.
Uses priority rules to determine which source to trust.
"""

from typing import Dict, Any, List, Optional
from datetime import date
from decimal import Decimal
from supabase import Client


class DataPriorityService:
    """Service to handle data priority and conflict resolution for wearable metrics."""
    
    # Source priority mapping (higher = more trusted)
    SOURCE_PRIORITY = {
        'whoop': 100,      # Highest priority for recovery/HRV
        'oura': 95,        # Highest for sleep quality
        'garmin': 80,      # Good for activity/workout data
        'polar': 75,       # Good for HR accuracy
        'apple_health': 60, # Aggregator, lower priority
        'terra': 55,       # Aggregator
        'fitbit': 50,      # Consumer grade
        'manual': 40       # User-entered data
    }
    
    def __init__(self, supabase_client: Client):
        """
        Initialize the data priority service.
        
        Args:
            supabase_client: Supabase client for database operations
        """
        self.supabase = supabase_client
    
    def get_source_priority(self, source: str) -> int:
        """
        Get the priority value for a given source.
        
        Args:
            source: Source name (e.g., 'whoop', 'oura', 'garmin')
            
        Returns:
            Priority value (higher = more trusted)
        """
        return self.SOURCE_PRIORITY.get(source.lower(), 30)
    
    def resolve_metric_conflict(
        self,
        user_id: str,
        metric_date: date,
        metric_type: str,
        new_value: Decimal,
        new_source: str
    ) -> Dict[str, Any]:
        """
        Resolve conflict when a new metric value is received.
        Determines whether to keep existing value or use new value based on priority.
        
        Args:
            user_id: User ID
            metric_date: Date of the metric
            metric_type: Type of metric (e.g., 'recovery_score', 'hrv')
            new_value: New metric value
            new_source: Source of new value
            
        Returns:
            Dict with 'action' ('insert', 'update', 'skip') and 'reason'
        """
        # Get existing metrics for this user/date/type
        result = self.supabase.table('health_metrics').select('*').eq(
            'user_id', user_id
        ).eq(
            'date', str(metric_date)
        ).eq(
            'metric_type', metric_type
        ).execute()
        
        existing_metrics = result.data if result.data else []
        
        # If no existing metrics, insert new one
        if not existing_metrics:
            return {
                'action': 'insert',
                'reason': 'No existing metric found',
                'priority': self.get_source_priority(new_source)
            }
        
        # Check if this exact source already exists
        existing_from_source = [m for m in existing_metrics if m['source'] == new_source]
        if existing_from_source:
            return {
                'action': 'update',
                'reason': f'Updating existing {new_source} metric',
                'existing_id': existing_from_source[0]['id'],
                'priority': self.get_source_priority(new_source)
            }
        
        # Check priority against existing metrics
        new_priority = self.get_source_priority(new_source)
        highest_existing_priority = max(
            self.get_source_priority(m['source']) for m in existing_metrics
        )
        
        if new_priority > highest_existing_priority:
            return {
                'action': 'insert',
                'reason': f'{new_source} has higher priority ({new_priority}) than existing sources ({highest_existing_priority})',
                'priority': new_priority
            }
        elif new_priority == highest_existing_priority:
            return {
                'action': 'insert',
                'reason': f'{new_source} has equal priority ({new_priority}), keeping both for comparison',
                'priority': new_priority
            }
        else:
            return {
                'action': 'skip',
                'reason': f'{new_source} has lower priority ({new_priority}) than existing sources ({highest_existing_priority})',
                'priority': new_priority
            }
    
    def get_best_metric_value(
        self,
        user_id: str,
        metric_date: date,
        metric_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the best (highest priority) metric value for a given user/date/type.
        
        Args:
            user_id: User ID
            metric_date: Date of the metric
            metric_type: Type of metric
            
        Returns:
            Dict with metric data or None if not found
        """
        result = self.supabase.table('health_metrics').select('*').eq(
            'user_id', user_id
        ).eq(
            'date', str(metric_date)
        ).eq(
            'metric_type', metric_type
        ).order(
            'source_priority', desc=True
        ).order(
            'recorded_at', desc=True
        ).limit(1).execute()
        
        return result.data[0] if result.data else None
    
    def merge_daily_summary(
        self,
        user_id: str,
        summary_date: date,
        new_data: Dict[str, Any],
        source: str
    ) -> Dict[str, Any]:
        """
        Merge new daily summary data with existing data, respecting source priorities.
        
        Args:
            user_id: User ID
            summary_date: Date of the summary
            new_data: New summary data to merge
            source: Source of new data
            
        Returns:
            Merged summary data
        """
        # Get existing summary
        result = self.supabase.table('daily_summaries').select('*').eq(
            'user_id', user_id
        ).eq(
            'date', str(summary_date)
        ).execute()
        
        existing = result.data[0] if result.data else {}
        
        # If no existing summary, use new data
        if not existing:
            new_data['sources'] = [source]
            return new_data
        
        # Merge data, preferring higher priority sources
        merged = existing.copy()
        new_priority = self.get_source_priority(source)
        
        # Add source to sources list if not already there
        sources = set(existing.get('sources', []))
        sources.add(source)
        merged['sources'] = list(sources)
        
        # For each field in new_data, decide whether to update
        for field, value in new_data.items():
            if field in ['sources', 'metadata', 'created_at', 'updated_at']:
                continue
            
            if value is not None:
                # If field doesn't exist in merged, add it
                if merged.get(field) is None:
                    merged[field] = value
                # If new source has higher priority, update
                # (This is simplified - in production, track source per field)
                elif new_priority >= 80:  # High priority sources can override
                    merged[field] = value
        
        return merged

