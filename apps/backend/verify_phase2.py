import sys
import os
from fastapi.testclient import TestClient

# Add current directory to path so we can import main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

def verify_warmup():
    print("Verifying Warmup Generation...")
    try:
        response = client.post("/api/warmup/generate", json={
            "workout_type": "upper_body",
            "duration_minutes": 5
        })
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['message']}")
            print(f"Warmup: {data['warmup']['name']}")
        else:
            print(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error calling endpoint: {e}")

def verify_nutrition():
    print("\nVerifying Nutrition Logging...")
    # Use a real user ID found via find_test_user.py
    user_id = "e38a889d-23f7-4f97-993b-df3aff3e9334"
    
    # 1. Log a meal
    try:
        log_response = client.post("/api/nutrition/log", json={
            "user_id": user_id,
            "meal_type": "lunch",
            "items": [
                {"name": "Chicken", "calories": 200, "protein": 30, "carbs": 0, "fat": 5},
                {"name": "Rice", "calories": 150, "protein": 3, "carbs": 35, "fat": 0}
            ],
            "log_date": "2025-11-19"
        })
        
        if log_response.status_code == 200:
            print("Log Success!")
            
            # 2. Get summary
            summary_response = client.get(f"/api/nutrition/summary?user_id={user_id}&date=2025-11-19")
            if summary_response.status_code == 200:
                summary = summary_response.json()
                print(f"Summary Success: {summary['total_calories']} calories")
                if summary['total_calories'] == 350:
                    print("Verification PASSED: Calories match.")
                else:
                    print(f"Verification FAILED: Expected 350 calories, got {summary['total_calories']}")
            else:
                print(f"Summary Failed: {summary_response.status_code} - {summary_response.text}")
        else:
            print(f"Log Failed: {log_response.status_code} - {log_response.text}")
    except Exception as e:
        print(f"Error calling endpoint: {e}")

if __name__ == "__main__":
    verify_warmup()
    verify_nutrition()
