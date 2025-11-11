#!/usr/bin/env python3
"""
Find Test User ID

Looks up the test user by email and prints their UUID.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

TEST_EMAIL = "test@voicefit.app"

print(f"\n🔍 Looking for test user: {TEST_EMAIL}\n")

# Look up user by email using Supabase Admin API
try:
    import requests

    headers = {
        "apikey": os.getenv("SUPABASE_SERVICE_KEY"),
        "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
        "Content-Type": "application/json"
    }

    # Get all users from auth
    response = requests.get(
        f"{os.getenv('SUPABASE_URL')}/auth/v1/admin/users",
        headers=headers
    )

    if response.status_code == 200:
        users = response.json().get("users", [])
        test_user = next((u for u in users if u.get("email") == TEST_EMAIL), None)

        if test_user:
            user_id = test_user.get("id")
            print(f"✅ Found user in auth.users:")
            print(f"   User ID: {user_id}")
            print(f"   Email: {test_user.get('email')}")

            # Now get user_profiles data
            profile_response = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()

            if profile_response.data and len(profile_response.data) > 0:
                profile = profile_response.data[0]
                print(f"   Profile ID: {profile.get('id')}")
                print(f"   Tier: {profile.get('tier', 'N/A')}")
                print(f"   Experience: {profile.get('experience_level', 'N/A')}")

            print(f"\n📝 Use this in tests: TEST_USER_ID = \"{user_id}\"")
        else:
            print(f"❌ User not found in auth.users")
            print(f"\n💡 Try running: python3 ../seed_test_user_data.py")
    else:
        print(f"❌ Error fetching users: {response.status_code}")
        print(f"   {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    print(f"\n💡 Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env")

