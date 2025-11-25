"""
Terra OAuth Service

Handles OAuth 2.0 flow for Terra integration:
- Authorization URL generation
- Token exchange
- Connection management
- Support for 8+ wearable providers through Terra
"""

import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from supabase import Client


class TerraOAuthService:
    """Terra OAuth 2.0 implementation"""

    OAUTH_BASE_URL = "https://api.tryterra.co/v2/auth"
    API_BASE_URL = "https://api.tryterra.co/v2"

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.api_key = os.getenv("TERRA_API_KEY", "")
        self.dev_id = os.getenv("TERRA_DEV_ID", "")
        self.webhook_secret = os.getenv("TERRA_WEBHOOK_SECRET", "")

    def get_authorization_url(self, user_id: str) -> str:
        """
        Generate Terra OAuth authorization URL

        Args:
            user_id: VoiceFit user ID

        Returns:
            Authorization URL for user to visit
        """
        params = {
            "client_id": self.dev_id,
            "redirect_uri": os.getenv("TERRA_REDIRECT_URI", ""),
            "response_type": "code",
            "scope": "activity sleep body daily",
            "state": user_id,
        }

        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.OAUTH_BASE_URL}?{query_string}"

    async def exchange_code_for_token(
        self, code: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from Terra
            user_id: VoiceFit user ID

        Returns:
            {
                "access_token": str,
                "terra_user_id": str,
                "connected_providers": list
            }
        """
        try:
            payload = {
                "code": code,
                "client_id": self.dev_id,
                "client_secret": self.api_key,
            }

            response = requests.post(
                f"{self.OAUTH_BASE_URL}/exchange",
                json=payload,
                timeout=30,
            )
            response.raise_for_status()

            token_data = response.json()
            terra_user_id = token_data.get("user_id", "")
            access_token = token_data.get("access_token", "")

            # Store connection in database
            await self._store_connection(
                user_id=user_id,
                terra_user_id=terra_user_id,
                access_token=access_token,
            )

            return {
                "access_token": access_token,
                "terra_user_id": terra_user_id,
                "connected_providers": token_data.get("providers", []),
            }

        except Exception as e:
            print(f"Error exchanging Terra code: {e}")
            raise

    async def _store_connection(
        self,
        user_id: str,
        terra_user_id: str,
        access_token: str,
    ):
        """Store Terra connection in database"""
        try:
            self.supabase.table("wearable_provider_connections").upsert(
                {
                    "user_id": user_id,
                    "provider": "terra",
                    "provider_user_id": terra_user_id,
                    "access_token": access_token,
                    "connected_at": datetime.utcnow().isoformat(),
                    "is_active": True,
                }
            ).execute()
        except Exception as e:
            print(f"Error storing Terra connection: {e}")
            raise

    async def get_connected_providers(self, user_id: str) -> Dict[str, Any]:
        """
        Get list of wearables connected through Terra

        Returns info about which providers (Garmin, Fitbit, Oura, etc.)
        are connected for this user
        """
        try:
            # Get Terra connection
            result = self.supabase.table("wearable_provider_connections").select(
                "*"
            ).eq("user_id", user_id).eq("provider", "terra").execute()

            if not result.data:
                return {"connected_providers": []}

            connection = result.data[0]
            access_token = connection.get("access_token")
            terra_user_id = connection.get("provider_user_id")

            if not access_token:
                return {"connected_providers": []}

            # Query Terra API for connected providers
            headers = {
                "Authorization": f"Bearer {access_token}",
                "X-API-Key": self.api_key,
                "X-Dev-ID": self.dev_id,
            }

            response = requests.get(
                f"{self.API_BASE_URL}/user/{terra_user_id}/providers",
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()

            data = response.json()
            return {
                "connected_providers": data.get("providers", []),
                "last_sync": connection.get("last_sync_at"),
            }

        except Exception as e:
            print(f"Error getting Terra providers: {e}")
            return {"connected_providers": []}

