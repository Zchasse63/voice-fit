"""
Feature Flag System for VoiceFit

Supports:
- Global feature flags (on/off for all users)
- Per-user overrides (force enable/disable for specific users)
- Percentage-based rollouts (enable for X% of users)
- In-memory caching for performance
- Database persistence (optional)

Usage:
    from feature_flags import feature_flags

    # Check if feature is enabled for user
    if feature_flags.is_enabled("enhanced_exercise_swap", user_id):
        # Use enhanced swap
    else:
        # Use legacy swap
"""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from supabase import Client

logger = logging.getLogger(__name__)


class FeatureFlags:
    """
    Feature flag manager with database persistence and in-memory caching.

    Features are defined in code, but can be overridden per-user in database.
    """

    # Default feature flags (can be overridden in database)
    DEFAULT_FLAGS = {
        "enhanced_exercise_swap": {
            "enabled": False,  # Global on/off
            "rollout_percentage": 0,  # 0-100% rollout
            "description": "Context-aware exercise swap with RAG + AI re-ranking",
            "premium_only": False,  # If True, only premium users can access
        },
        "ai_reranking": {
            "enabled": False,
            "rollout_percentage": 0,
            "description": "AI re-ranking of exercise substitutes (Grok 4 Fast)",
            "premium_only": True,  # Premium feature
        },
        "db_backed_sessions": {
            "enabled": False,
            "rollout_percentage": 0,
            "description": "Database-backed workout sessions (survives restarts)",
            "premium_only": False,
        },
        "parallel_context_retrieval": {
            "enabled": False,
            "rollout_percentage": 0,
            "description": "Parallel DB + RAG queries for faster context gathering",
            "premium_only": False,
        },
        "cross_session_lookback": {
            "enabled": False,
            "rollout_percentage": 0,
            "description": "Reference previous workouts ('same as last week')",
            "premium_only": False,
        },
        "program_aware_swaps": {
            "enabled": False,
            "rollout_percentage": 0,
            "description": "Exercise swaps consider active training program",
            "premium_only": False,
        },
    }

    def __init__(self, supabase_client: Optional[Client] = None):
        """
        Initialize feature flags.

        Args:
            supabase_client: Optional Supabase client for database persistence
        """
        self.supabase = supabase_client
        self._cache: Dict[str, Any] = {}
        self._cache_expires: Dict[str, datetime] = {}
        self._cache_ttl = timedelta(minutes=5)  # Cache for 5 minutes

        # Load flags from database on init
        if self.supabase:
            self._load_flags_from_db()

    def is_enabled(
        self,
        flag_name: str,
        user_id: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Check if a feature flag is enabled for a user.

        Decision hierarchy:
        1. Per-user override (database)
        2. Premium-only check (if flag requires premium)
        3. Rollout percentage (consistent hash-based)
        4. Global enabled flag

        Args:
            flag_name: Name of the feature flag
            user_id: User ID to check (optional)
            user_context: Optional user context (subscription_tier, etc.)

        Returns:
            True if feature is enabled for this user
        """
        # Check if flag exists
        if flag_name not in self.DEFAULT_FLAGS:
            logger.warning(f"Unknown feature flag: {flag_name}")
            return False

        # Get flag config (with caching)
        flag_config = self._get_flag_config(flag_name)

        # Check per-user override first (highest priority)
        if user_id and self.supabase:
            override = self._get_user_override(flag_name, user_id)
            if override is not None:
                logger.debug(
                    f"Flag {flag_name} user override for {user_id}: {override}"
                )
                return override

        # Check if flag is globally disabled
        if not flag_config.get("enabled", False):
            return False

        # Check premium-only restriction
        if flag_config.get("premium_only", False):
            if not user_context or user_context.get("subscription_tier") != "premium":
                logger.debug(f"Flag {flag_name} requires premium - user not premium")
                return False

        # Check rollout percentage (if user_id provided)
        if user_id:
            rollout_pct = flag_config.get("rollout_percentage", 0)
            if rollout_pct < 100:
                if not self._is_in_rollout(flag_name, user_id, rollout_pct):
                    logger.debug(f"Flag {flag_name} not in rollout for {user_id}")
                    return False

        # All checks passed
        return True

    def enable_for_user(self, flag_name: str, user_id: str) -> bool:
        """
        Force enable a flag for a specific user (override).

        Args:
            flag_name: Feature flag name
            user_id: User ID

        Returns:
            True if successful
        """
        if not self.supabase:
            logger.warning("Cannot set user override - no database connection")
            return False

        try:
            self.supabase.table("feature_flag_overrides").upsert(
                {
                    "flag_name": flag_name,
                    "user_id": user_id,
                    "enabled": True,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ).execute()

            # Clear cache for this user
            cache_key = f"{flag_name}:{user_id}"
            self._cache.pop(cache_key, None)

            logger.info(f"Enabled flag {flag_name} for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error setting user override: {e}")
            return False

    def disable_for_user(self, flag_name: str, user_id: str) -> bool:
        """
        Force disable a flag for a specific user (override).

        Args:
            flag_name: Feature flag name
            user_id: User ID

        Returns:
            True if successful
        """
        if not self.supabase:
            logger.warning("Cannot set user override - no database connection")
            return False

        try:
            self.supabase.table("feature_flag_overrides").upsert(
                {
                    "flag_name": flag_name,
                    "user_id": user_id,
                    "enabled": False,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ).execute()

            # Clear cache for this user
            cache_key = f"{flag_name}:{user_id}"
            self._cache.pop(cache_key, None)

            logger.info(f"Disabled flag {flag_name} for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error setting user override: {e}")
            return False

    def update_flag(
        self,
        flag_name: str,
        enabled: Optional[bool] = None,
        rollout_percentage: Optional[int] = None,
        premium_only: Optional[bool] = None,
    ) -> bool:
        """
        Update a global flag configuration.

        Args:
            flag_name: Feature flag name
            enabled: Global enabled state (optional)
            rollout_percentage: Rollout percentage 0-100 (optional)
            premium_only: Premium-only restriction (optional)

        Returns:
            True if successful
        """
        if not self.supabase:
            logger.warning("Cannot update flag - no database connection")
            return False

        try:
            updates = {
                "flag_name": flag_name,
                "updated_at": datetime.utcnow().isoformat(),
            }

            if enabled is not None:
                updates["enabled"] = enabled
            if rollout_percentage is not None:
                updates["rollout_percentage"] = max(0, min(100, rollout_percentage))
            if premium_only is not None:
                updates["premium_only"] = premium_only

            self.supabase.table("feature_flags").upsert(updates).execute()

            # Clear cache
            self._cache.pop(flag_name, None)
            self._cache_expires.pop(flag_name, None)

            logger.info(f"Updated flag {flag_name}: {updates}")
            return True

        except Exception as e:
            logger.error(f"Error updating flag: {e}")
            return False

    def get_all_flags(self) -> Dict[str, Any]:
        """
        Get all feature flags with their current state.

        Returns:
            Dict of flag_name -> config
        """
        flags = {}
        for flag_name in self.DEFAULT_FLAGS.keys():
            flags[flag_name] = self._get_flag_config(flag_name)
        return flags

    def _get_flag_config(self, flag_name: str) -> Dict[str, Any]:
        """
        Get flag configuration (with caching).

        Priority:
        1. Database (if available and not expired)
        2. Cache (if not expired)
        3. Default
        """
        # Check cache first
        if flag_name in self._cache:
            if datetime.utcnow() < self._cache_expires.get(flag_name, datetime.min):
                return self._cache[flag_name]

        # Try to load from database
        if self.supabase:
            try:
                result = (
                    self.supabase.table("feature_flags")
                    .select("*")
                    .eq("flag_name", flag_name)
                    .single()
                    .execute()
                )

                if result.data:
                    config = {
                        **self.DEFAULT_FLAGS[flag_name],
                        "enabled": result.data.get(
                            "enabled", self.DEFAULT_FLAGS[flag_name]["enabled"]
                        ),
                        "rollout_percentage": result.data.get("rollout_percentage", 0),
                        "premium_only": result.data.get(
                            "premium_only",
                            self.DEFAULT_FLAGS[flag_name].get("premium_only", False),
                        ),
                    }

                    # Cache it
                    self._cache[flag_name] = config
                    self._cache_expires[flag_name] = datetime.utcnow() + self._cache_ttl

                    return config

            except Exception as e:
                logger.debug(f"Could not load flag {flag_name} from DB: {e}")

        # Return default
        return self.DEFAULT_FLAGS[flag_name]

    def _get_user_override(self, flag_name: str, user_id: str) -> Optional[bool]:
        """
        Get per-user override from database (with caching).

        Returns:
            True/False if override exists, None if no override
        """
        if not self.supabase:
            return None

        cache_key = f"{flag_name}:{user_id}"

        # Check cache
        if cache_key in self._cache:
            if datetime.utcnow() < self._cache_expires.get(cache_key, datetime.min):
                return self._cache[cache_key]

        # Query database
        try:
            result = (
                self.supabase.table("feature_flag_overrides")
                .select("enabled")
                .eq("flag_name", flag_name)
                .eq("user_id", user_id)
                .single()
                .execute()
            )

            if result.data:
                enabled = result.data["enabled"]

                # Cache it
                self._cache[cache_key] = enabled
                self._cache_expires[cache_key] = datetime.utcnow() + self._cache_ttl

                return enabled

        except Exception as e:
            logger.debug(f"No override for {flag_name}:{user_id}")

        return None

    def _is_in_rollout(self, flag_name: str, user_id: str, percentage: int) -> bool:
        """
        Check if user is in the rollout percentage using consistent hashing.

        This ensures the same user always gets the same result for a flag,
        even across multiple servers/requests.

        Args:
            flag_name: Feature flag name
            user_id: User ID
            percentage: Rollout percentage (0-100)

        Returns:
            True if user is in the rollout group
        """
        if percentage >= 100:
            return True
        if percentage <= 0:
            return False

        # Create consistent hash from flag_name + user_id
        hash_input = f"{flag_name}:{user_id}".encode("utf-8")
        hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)

        # Map hash to 0-100 range
        bucket = hash_value % 100

        # User is in rollout if their bucket is within percentage
        return bucket < percentage

    def _load_flags_from_db(self):
        """Load all flags from database into cache (on init)."""
        if not self.supabase:
            return

        try:
            result = self.supabase.table("feature_flags").select("*").execute()

            if result.data:
                for row in result.data:
                    flag_name = row["flag_name"]
                    if flag_name in self.DEFAULT_FLAGS:
                        config = {
                            **self.DEFAULT_FLAGS[flag_name],
                            "enabled": row.get("enabled", False),
                            "rollout_percentage": row.get("rollout_percentage", 0),
                            "premium_only": row.get("premium_only", False),
                        }

                        self._cache[flag_name] = config
                        self._cache_expires[flag_name] = (
                            datetime.utcnow() + self._cache_ttl
                        )

                logger.info(f"Loaded {len(result.data)} feature flags from database")

        except Exception as e:
            logger.warning(f"Could not load flags from database: {e}")


# Singleton instance
_feature_flags_instance: Optional[FeatureFlags] = None


def get_feature_flags(supabase_client: Optional[Client] = None) -> FeatureFlags:
    """
    Get or create singleton feature flags instance.

    Args:
        supabase_client: Optional Supabase client for database persistence

    Returns:
        FeatureFlags instance
    """
    global _feature_flags_instance

    if _feature_flags_instance is None:
        _feature_flags_instance = FeatureFlags(supabase_client)

    return _feature_flags_instance


# Convenience function for quick checks
def is_enabled(
    flag_name: str,
    user_id: Optional[str] = None,
    user_context: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Quick check if a feature is enabled.

    Usage:
        from feature_flags import is_enabled

        if is_enabled("enhanced_exercise_swap", user_id):
            # Use enhanced swap
    """
    flags = get_feature_flags()
    return flags.is_enabled(flag_name, user_id, user_context)
