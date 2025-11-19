import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"
USER_ID = "user_2fS257I6M1U0123456789012345"  # Use a valid UUID format if possible, or the one from previous tests

def test_chat_classification():
    print("\nTesting Chat Classification for Nutrition...")
    url = f"{BASE_URL}/api/chat/classify"
    
    test_messages = [
        "I ate a chicken sandwich for lunch",
        "Log 2 eggs and toast",
        "Had a protein shake",
        "Add 500 calories for lunch",
        "What should I eat?", # Should be question
        "Bench press 225 for 5", # Should be workout_log
    ]
    
    for msg in test_messages:
        payload = {
            "message": msg,
            "user_id": USER_ID,
            "conversation_history": []
        }
        
        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                print(f"Message: '{msg}' -> Type: {data.get('message_type')}, Action: {data.get('suggested_action')}")
            else:
                print(f"Failed to classify '{msg}': {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error testing classification: {e}")

def test_nutrition_parsing():
    print("\nTesting Nutrition Parsing...")
    url = f"{BASE_URL}/api/nutrition/parse"
    
    test_texts = [
        "I ate a chicken sandwich and an apple for lunch",
        "2 scoops of protein powder and milk",
    ]
    
    for text in test_texts:
        payload = {
            "text": text,
            "user_id": USER_ID
        }
        
        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                print(f"Text: '{text}'")
                print(json.dumps(data, indent=2))
            else:
                print(f"Failed to parse '{text}': {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error testing parsing: {e}")

if __name__ == "__main__":
    print("Starting Verification for Nutrition Voice Intent...")
    test_chat_classification()
    test_nutrition_parsing()
