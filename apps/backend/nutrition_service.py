import os
from typing import Dict, List, Optional, Any
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

import requests
import json
import time

class NutritionService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.xai_api_key = os.getenv("XAI_API_KEY")
        self.xai_base_url = "https://api.x.ai/v1"
        self.model_id = "grok-4-fast-reasoning"

        if not self.supabase_key:
             self.supabase_key = os.getenv("SUPABASE_ANON_KEY")

        if not self.supabase_url or not self.supabase_key:
            print("Warning: Missing Supabase credentials for NutritionService")
            self.supabase = None
        else:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    def parse_nutrition_text(self, text: str) -> Dict[str, Any]:
        """
        Parse natural language nutrition text into structured data using LLM.
        """
        if not self.xai_api_key:
            raise ValueError("Missing XAI_API_KEY for nutrition parsing")

        system_prompt = """You are a nutrition logging assistant. Parse the user's text into structured nutrition data.
        
        Return a JSON object with this structure:
        {
            "meal_type": "breakfast" | "lunch" | "dinner" | "snack",
            "items": [
                {
                    "name": "food name",
                    "calories": int,
                    "protein": int (grams),
                    "carbs": int (grams),
                    "fat": int (grams),
                    "quantity": "quantity string"
                }
            ],
            "confidence": 0.0-1.0
        }
        
        Estimate calories and macros if not explicitly stated, based on standard portion sizes.
        If the meal type is not clear, infer it based on the food or time of day (default to snack).
        """

        try:
            headers = {
                "Authorization": f"Bearer {self.xai_api_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": self.model_id,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }

            response = requests.post(
                f"{self.xai_base_url}/chat/completions", 
                headers=headers, 
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"LLM API error: {response.text}")
                
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            parsed_data = json.loads(content)
            
            return parsed_data

        except Exception as e:
            print(f"Error parsing nutrition text: {e}")
            # Return a fallback structure or raise
            return {
                "meal_type": "snack", 
                "items": [], 
                "confidence": 0.0,
                "error": str(e)
            }

    def log_nutrition(self, user_id: str, meal_type: str, items: List[Dict[str, Any]], log_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Log a nutrition entry.
        """
        if not self.supabase:
             raise ValueError("Supabase client not initialized")

        if not log_date:
            log_date = date.today().isoformat()
            
        # Calculate totals
        total_calories = sum(item.get("calories", 0) for item in items)
        protein_g = sum(item.get("protein", 0) for item in items)
        carbs_g = sum(item.get("carbs", 0) for item in items)
        fats_g = sum(item.get("fat", 0) for item in items)
        
        data = {
            "user_id": user_id,
            "log_date": log_date,
            "meal_type": meal_type,
            "items": items,
            "total_calories": int(total_calories),
            "protein_g": int(protein_g),
            "carbs_g": int(carbs_g),
            "fats_g": int(fats_g)
        }
        
        response = self.supabase.table("nutrition_logs").insert(data).execute()
        
        if not response.data:
            raise Exception("Failed to insert nutrition log")
            
        return {
            "log_id": response.data[0]["id"],
            "summary": {
                "total_calories": total_calories,
                "protein_g": protein_g,
                "carbs_g": carbs_g,
                "fats_g": fats_g
            }
        }

    def get_daily_summary(self, user_id: str, log_date: str) -> Dict[str, Any]:
        """
        Get nutrition summary for a specific date.
        """
        if not self.supabase:
             raise ValueError("Supabase client not initialized")

        response = self.supabase.table("nutrition_logs")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("log_date", log_date)\
            .execute()
            
        logs = response.data
        
        summary = {
            "total_calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fats_g": 0,
            "logs": logs
        }
        
        for log in logs:
            summary["total_calories"] += log["total_calories"]
            summary["protein_g"] += log["protein_g"]
            summary["carbs_g"] += log["carbs_g"]
            summary["fats_g"] += log["fats_g"]
            
        return summary

    def sync_nutrition_summary(self, user_id: str, log_date: str, summary: Dict[str, float]) -> Dict[str, Any]:
        """
        Sync daily nutrition summary from external source (Apple Health).
        Replaces any existing sync entry for the given date.
        """
        if not self.supabase:
             raise ValueError("Supabase client not initialized")

        # Delete existing sync entries for this date
        self.supabase.table("nutrition_logs")\
            .delete()\
            .eq("user_id", user_id)\
            .eq("log_date", log_date)\
            .eq("meal_type", "apple_health_sync")\
            .execute()
            
        # Insert new sync entry
        data = {
            "user_id": user_id,
            "log_date": log_date,
            "meal_type": "apple_health_sync",
            "items": [{"name": "Apple Health Sync", "quantity": "1 day"}], # Dummy item
            "total_calories": int(summary.get("calories", 0)),
            "protein_g": int(summary.get("protein", 0)),
            "carbs_g": int(summary.get("carbs", 0)),
            "fats_g": int(summary.get("fat", 0))
        }
        
        response = self.supabase.table("nutrition_logs").insert(data).execute()
        
        if not response.data:
            raise Exception("Failed to insert nutrition sync log")
            
        return {
            "success": True,
            "log_id": response.data[0]["id"]
        }

nutrition_service = NutritionService()
