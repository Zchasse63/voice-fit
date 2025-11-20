"""
Health Snapshot Cron Job

Background job to generate daily health snapshots for all users.
Runs daily at 6:00 AM user local time.

Usage:
    python health_snapshot_cron.py
"""

import os
import asyncio
from datetime import datetime, date, timedelta
from supabase import create_client, Client
from health_snapshot_service import HealthSnapshotService
from dotenv import load_dotenv

load_dotenv()


async def generate_snapshots_for_all_users():
    """Generate health snapshots for all active users"""
    
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase configuration missing")
        return
    
    supabase: Client = create_client(supabase_url, supabase_key)
    snapshot_service = HealthSnapshotService(supabase)
    
    # Get all active users
    try:
        result = supabase.table("user_profiles").select("user_id").execute()
        users = result.data
        
        if not users:
            print("ℹ️  No users found")
            return
        
        print(f"📊 Generating snapshots for {len(users)} users...")
        
        # Generate snapshot for yesterday (data is usually complete by 6 AM)
        snapshot_date = str(date.today() - timedelta(days=1))
        
        success_count = 0
        error_count = 0
        
        for user in users:
            user_id = user["user_id"]
            
            try:
                # Check if snapshot already exists
                existing = (
                    supabase.table("health_snapshots")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("date", snapshot_date)
                    .execute()
                )
                
                if existing.data:
                    print(f"⏭️  Snapshot already exists for user {user_id[:8]}... on {snapshot_date}")
                    continue
                
                # Generate snapshot
                snapshot = await snapshot_service.generate_snapshot(user_id, snapshot_date)
                
                if snapshot:
                    success_count += 1
                    completeness = snapshot.get("data_completeness_score", 0)
                    print(f"✅ Generated snapshot for user {user_id[:8]}... (completeness: {completeness}%)")
                else:
                    error_count += 1
                    print(f"⚠️  Failed to generate snapshot for user {user_id[:8]}...")
                    
            except Exception as e:
                error_count += 1
                print(f"❌ Error generating snapshot for user {user_id[:8]}...: {e}")
        
        print(f"\n📈 Summary:")
        print(f"   ✅ Success: {success_count}")
        print(f"   ❌ Errors: {error_count}")
        print(f"   📅 Date: {snapshot_date}")
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")


async def generate_snapshot_for_user(user_id: str, snapshot_date: str = None):
    """Generate health snapshot for a specific user (for testing)"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase configuration missing")
        return
    
    supabase: Client = create_client(supabase_url, supabase_key)
    snapshot_service = HealthSnapshotService(supabase)
    
    if not snapshot_date:
        snapshot_date = str(date.today())
    
    try:
        print(f"📊 Generating snapshot for user {user_id} on {snapshot_date}...")
        snapshot = await snapshot_service.generate_snapshot(user_id, snapshot_date)
        
        if snapshot:
            print(f"✅ Snapshot generated successfully!")
            print(f"   Completeness: {snapshot.get('data_completeness_score', 0)}%")
            print(f"   Summary: {snapshot.get('ai_summary', 'N/A')}")
            print(f"   Recommendations: {len(snapshot.get('ai_recommendations', []))}")
            print(f"   Risk Flags: {len(snapshot.get('risk_flags', []))}")
        else:
            print(f"⚠️  Failed to generate snapshot")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Test mode: generate for specific user
        user_id = sys.argv[1]
        snapshot_date = sys.argv[2] if len(sys.argv) > 2 else None
        asyncio.run(generate_snapshot_for_user(user_id, snapshot_date))
    else:
        # Production mode: generate for all users
        asyncio.run(generate_snapshots_for_all_users())

