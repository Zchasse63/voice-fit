"""
WHOOP OAuth Service

Handles OAuth 2.0 flow for WHOOP integration:
- Authorization URL generation
- Token exchange
- Token refresh
- Connection management
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from supabase import Client


class WHOOPOAuthService:
    """WHOOP OAuth 2.0 implementation"""

    OAUTH_BASE_URL = "https://api.prod.whoop.com/oauth"
    API_BASE_URL = "https://api.prod.whoop.com/developer/v1"

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client_id = os.getenv("WHOOP_CLIENT_ID", "")
        self.client_secret = os.getenv("WHOOP_CLIENT_SECRET", "")
        self.redirect_uri = os.getenv("WHOOP_REDIRECT_URI", "")

    def get_authorization_url(self, user_id: str, state: str) -> str:
        """
        Generate WHOOP OAuth authorization URL

        Args:
            user_id: VoiceFit user ID
            state: CSRF protection state token

        Returns:
            Authorization URL for user to visit
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "read:recovery read:sleep read:workout read:cycles offline",
            "state": state,
        }

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.OAUTH_BASE_URL}/authorize?{query_string}"

    async def exchange_code_for_token(
        self, code: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from WHOOP
            user_id: VoiceFit user ID

        Returns:
            {
                "access_token": str,
                "refresh_token": str,
                "expires_in": int,
                "token_type": str,
                "whoop_user_id": str
            }
        """
        try:
            payload = {
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": self.redirect_uri,
            }

            response = requests.post(
                f"{self.OAUTH_BASE_URL}/token",
                json=payload,
                timeout=30,
            )
            response.raise_for_status()

            token_data = response.json()

            # Get WHOOP user ID
            whoop_user_id = await self._get_whoop_user_id(token_data["access_token"])

            # Store connection in database
            await self._store_connection(
                user_id=user_id,
                whoop_user_id=whoop_user_id,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                expires_at=datetime.utcnow()
                + timedelta(seconds=token_data.get("expires_in", 3600)),
            )

            return {
                "access_token": token_data["access_token"],
                "refresh_token": token_data.get("refresh_token"),
                "expires_in": token_data.get("expires_in", 3600),
                "token_type": token_data.get("token_type", "Bearer"),
                "whoop_user_id": whoop_user_id,
            }

        except Exception as e:
            print(f"Error exchanging WHOOP code: {e}")
            raise

    async def _get_whoop_user_id(self, access_token: str) -> str:
        """Get WHOOP user ID from API"""
        try:
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(
                f"{self.API_BASE_URL}/user/profile",
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("user_id", "")
        except Exception as e:
            print(f"Error getting WHOOP user ID: {e}")
            raise

    async def _store_connection(
        self,
        user_id: str,
        whoop_user_id: str,
        access_token: str,
        refresh_token: Optional[str],
        expires_at: datetime,
    ):
        """Store WHOOP connection in database"""
        try:
            self.supabase.table("wearable_provider_connections").upsert(
                {
                    "user_id": user_id,
                    "provider": "whoop",
                    "provider_user_id": whoop_user_id,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_expires_at": expires_at.isoformat(),
                    "connected_at": datetime.utcnow().isoformat(),
                    "is_active": True,
                }
            ).execute()
        except Exception as e:
            print(f"Error storing WHOOP connection: {e}")
            raise

    async def refresh_access_token(self, user_id: str) -> Optional[str]:
        """Refresh WHOOP access token"""
        try:
            # Get current connection
            result = self.supabase.table("wearable_provider_connections").select(
                "*"
            ).eq("user_id", user_id).eq("provider", "whoop").execute()

            if not result.data:
                return None

            connection = result.data[0]
            refresh_token = connection.get("refresh_token")

            if not refresh_token:
                return None

            # Exchange refresh token for new access token
            payload = {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }

            response = requests.post(
                f"{self.OAUTH_BASE_URL}/token",
                json=payload,
                timeout=30,
            )
            response.raise_for_status()

            token_data = response.json()
            new_access_token = token_data["access_token"]

            # Update in database
            self.supabase.table("wearable_provider_connections").update(
                {
                    "access_token": new_access_token,
                    "refresh_token": token_data.get("refresh_token", refresh_token),
                    "token_expires_at": (
                        datetime.utcnow()
                        + timedelta(seconds=token_data.get("expires_in", 3600))
                    ).isoformat(),
                }
            ).eq("user_id", user_id).eq("provider", "whoop").execute()

            return new_access_token

        except Exception as e:
            print(f"Error refreshing WHOOP token: {e}")
            return None

