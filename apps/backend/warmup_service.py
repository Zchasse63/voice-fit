import os
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

class WarmupService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        # Fallback to anon key if service key not found (for read operations mainly)
        if not self.supabase_key:
             self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
             
        if not self.supabase_url or not self.supabase_key:
            # Don't raise error immediately to allow import, but methods will fail
            print("Warning: Missing Supabase credentials for WarmupService")
            self.supabase = None
        else:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    def generate_warmup(self, workout_type: str, duration_minutes: int = 5) -> Dict[str, Any]:
        """
        Generate a warmup routine based on workout type.
        """
        if not self.supabase:
             raise ValueError("Supabase client not initialized")

        # Try to find a template for the workout type
        try:
            response = self.supabase.table("warmup_templates")\
                .select("*")\
                .eq("workout_type", workout_type)\
                .execute()
            
            templates = response.data
            
            if templates:
                # Return the first matching template for now
                # In future, could randomize or pick based on duration
                template = templates[0]
                return {
                    "name": template["name"],
                    "exercises": template["exercises"],
                    "duration_minutes": template["duration_minutes"]
                }
        except Exception as e:
            print(f"Error fetching warmup template: {e}")
        
        # Fallback if no template found or error
        return {
            "name": "General Warmup",
            "exercises": [
                {"name": "Jumping Jacks", "duration": "60s"},
                {"name": "Arm Circles", "duration": "30s"},
                {"name": "Bodyweight Squats", "reps": 15}
            ],
            "duration_minutes": 5
        }

warmup_service = WarmupService()
