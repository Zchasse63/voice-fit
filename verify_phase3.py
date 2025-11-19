import requests
import json
import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

load_dotenv()

# Database connection (Direct for verification)
DB_URL = os.getenv("DATABASE_URL")

def test_schema_changes():
    print("\nTesting Schema Changes (user_profiles)...")
    if not DB_URL:
        print("Skipping DB test: DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Check if columns exist
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            AND column_name IN ('primary_sport', 'sport_level', 'season_status');
        """)
        columns = [row[0] for row in cur.fetchall()]
        
        print(f"Found columns: {columns}")
        if len(columns) == 3:
            print("SUCCESS: All 3 new columns found in user_profiles.")
        else:
            print(f"FAILURE: Missing columns. Found only: {columns}")
            
        conn.close()
    except Exception as e:
        print(f"Error testing schema: {e}")

def test_program_generation_with_sport_context():
    print("\nTesting Program Generation with Sport Context...")
    
    # Mocking the service call locally to avoid full API spinup if possible, 
    # but better to test the actual service class logic if we can import it.
    # Since we can't easily import backend modules from here without path hacking,
    # let's try to instantiate the service class directly if possible, or mock the prompt build.
    
    try:
        import sys
        sys.path.append(os.path.join(os.getcwd(), "apps/backend"))
        from program_generation_service import ProgramGenerationService
        
        service = ProgramGenerationService()
        
        questionnaire = {
            "primary_goal": "strength",
            "primary_sport": "Basketball",
            "sport_level": "Competitive",
            "season_status": "In-Season"
        }
        
        # Test prompt building (private method access for verification)
        prompt = service._build_program_prompt(questionnaire, "Mock Knowledge Context")
        
        print("Generated Prompt Snippet:")
        print("-" * 40)
        print(prompt[:500] + "...") # Print first 500 chars
        print("-" * 40)
        
        if "Basketball" in prompt and "Competitive" in prompt and "In-Season" in prompt:
            print("SUCCESS: Sport context correctly injected into prompt.")
        else:
            print("FAILURE: Sport context missing from prompt.")
            
        # Test Namespace Selection Logic
        print("\nTesting Smart Namespace Selection for Basketball...")
        from smart_namespace_selector import SmartNamespaceSelector
        import smart_namespace_selector
        print(f"DEBUG: Loaded smart_namespace_selector from {smart_namespace_selector.__file__}")
        
        selector = SmartNamespaceSelector()
        namespaces = selector.select_namespaces(questionnaire)
        
        print(f"Selected Namespaces: {list(namespaces.keys())}")
        
        if "sports-performance" in namespaces and "plyometrics" in namespaces:
            print("SUCCESS: Basketball-specific namespaces selected.")
        else:
            print("FAILURE: Basketball-specific namespaces MISSING.")

    except Exception as e:
        print(f"Error testing program generation logic: {e}")

if __name__ == "__main__":
    print("Starting Verification for Phase 3 (Athlete Expansion)...")
    test_schema_changes()
    test_program_generation_with_sport_context()
