import os
import sys
from datetime import date
from dotenv import load_dotenv

# Add apps/backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "apps/backend"))

from nutrition_service import NutritionService

# Load environment variables
load_dotenv()

def verify_nutrition_sync():
    print("=" * 50)
    print("VERIFYING NUTRITION SYNC")
    print("=" * 50)

    # Initialize service
    try:
        service = NutritionService()
        print("✅ NutritionService initialized")
    except Exception as e:
        print(f"❌ Failed to initialize NutritionService: {e}")
        return

    # Fetch an existing user ID
    try:
        # Try to get a user from auth.users (requires service role key)
        response = service.supabase.auth.admin.list_users()
        print(f"DEBUG: list_users response type: {type(response)}")
        
        if hasattr(response, 'users') and response.users:
            user_id = response.users[0].id
            print(f"Using auth user ID (from object): {user_id}")
        elif isinstance(response, list) and len(response) > 0:
            # Check if elements have .id
            if hasattr(response[0], 'id'):
                user_id = response[0].id
                print(f"Using auth user ID (from list): {user_id}")
            else:
                print(f"DEBUG: First element: {response[0]}")
                # Maybe it's a dictionary?
                if isinstance(response[0], dict) and 'id' in response[0]:
                    user_id = response[0]['id']
                    print(f"Using auth user ID (from dict list): {user_id}")
        else:
            print("DEBUG: Could not parse list_users response")
            # Fallback to user_profiles
            print("No auth users found, checking user_profiles...")
            user_response = service.supabase.table("user_profiles").select("id").limit(1).execute()
            if user_response.data:
                user_id = user_response.data[0]["id"]
                print(f"Using user_profiles ID: {user_id}")
            else:
                print("❌ No users found. Cannot test.")
                return
    except Exception as e:
        print(f"❌ Failed to fetch user: {e}")
        # Fallback to user_profiles if auth admin fails
        try:
            user_response = service.supabase.table("user_profiles").select("id").limit(1).execute()
            if user_response.data:
                user_id = user_response.data[0]["id"]
                print(f"Using user_profiles ID (fallback): {user_id}")
            else:
                return
        except:
            return
    log_date = date.today().isoformat()
    summary = {
        "calories": 2500,
        "protein": 180,
        "carbs": 250,
        "fat": 80
    }

    print(f"\nSyncing nutrition for user {user_id} on {log_date}...")
    print(f"Summary: {summary}")

    try:
        result = service.sync_nutrition_summary(user_id, log_date, summary)
        print(f"✅ Sync successful: {result}")
        
        # Verify data was stored
        print("\nVerifying stored data...")
        stored_summary = service.get_daily_summary(user_id, log_date)
        print(f"Stored summary: {stored_summary}")
        
        # Check if totals match (allowing for some difference if other logs exist, but here we expect exact match if it's the only log or if we check the specific entry)
        # Note: get_daily_summary sums up all logs. If we run this multiple times, we might have other logs?
        # Actually sync_nutrition_summary deletes previous 'apple_health_sync' entries, but not other meal types.
        # For this test user, we assume clean state or we check the specific values.
        
        if stored_summary["total_calories"] >= 2500:
             print("✅ Stored calories match or exceed sync value")
        else:
             print(f"❌ Stored calories mismatch: {stored_summary['total_calories']}")

    except Exception as e:
        print(f"❌ Sync failed: {e}")

if __name__ == "__main__":
    verify_nutrition_sync()
