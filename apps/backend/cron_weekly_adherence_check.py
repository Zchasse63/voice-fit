#!/usr/bin/env python3
"""
Weekly Adherence Check Cron Job

Runs every Sunday at 11:59 PM to check program adherence for all Premium users.

Schedule: 0 23 * * 0 (Every Sunday at 11:59 PM)

Usage:
    python3 apps/backend/cron_weekly_adherence_check.py
"""

import os
import sys
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(os.path.dirname(__file__))

from program_adherence_monitor import ProgramAdherenceMonitor

# Load environment variables
load_dotenv()


def get_premium_users(supabase):
    """
    Get all Premium users who have active programs.
    
    Returns:
        List of user IDs
    """
    try:
        # Get all users with Premium tier and active programs
        result = supabase.table('generated_programs')\
            .select('user_id')\
            .eq('status', 'active')\
            .execute()
        
        if not result.data:
            return []
        
        # Get unique user IDs
        user_ids = list(set([program['user_id'] for program in result.data]))
        
        print(f"📊 Found {len(user_ids)} Premium users with active programs")
        return user_ids
    
    except Exception as e:
        print(f"❌ Error fetching Premium users: {e}")
        return []


def send_adherence_alert(supabase, user_id, alert):
    """
    Send adherence alert to user.
    
    In production, this would:
    1. Send push notification
    2. Create in-app notification
    3. Send email (optional)
    
    For now, we'll just create an in-app notification.
    
    Args:
        supabase: Supabase client
        user_id: User ID
        alert: Alert data
    """
    try:
        muscle_group = alert['muscle_group']
        target_sets = alert['target_weekly_sets']
        actual_sets = alert['actual_weekly_sets']
        variance = alert['variance_percentage']
        
        # Create notification message
        message = f"Hey! I noticed your {muscle_group} volume is {abs(variance):.0f}% below your program target. "
        message += f"You're doing {actual_sets} sets/week but your program calls for {target_sets} sets. "
        message += f"Everything okay? Tap to let me know what's up."
        
        # Create in-app notification
        notification_data = {
            'user_id': user_id,
            'type': 'adherence_alert',
            'title': f'{muscle_group.capitalize()} Volume Check-In',
            'message': message,
            'data': {
                'flag_id': alert.get('flag_id'),
                'muscle_group': muscle_group,
                'target_sets': target_sets,
                'actual_sets': actual_sets,
                'variance_percentage': variance
            },
            'read': False,
            'created_at': datetime.now().isoformat()
        }
        
        supabase.table('notifications').insert(notification_data).execute()
        
        print(f"  ✅ Sent alert to user {user_id}: {muscle_group} ({variance:.0f}% below target)")
        
        # TODO: Send push notification via Expo Push Notifications
        # TODO: Send email notification (optional, based on user preferences)
        
    except Exception as e:
        print(f"  ❌ Error sending alert to user {user_id}: {e}")


def send_imbalance_alert(supabase, user_id, risk):
    """
    Send imbalance risk alert to user.
    
    Args:
        supabase: Supabase client
        user_id: User ID
        risk: Imbalance risk data
    """
    try:
        risk_type = risk['type']
        severity = risk['severity']
        ratio = risk['ratio']
        recommendation = risk['recommendation']
        
        # Create notification message
        if risk_type == 'quad_hamstring_imbalance':
            message = f"⚠️ Imbalance Alert: Your quad-to-hamstring ratio is {ratio}:1 ({severity} risk). "
        else:  # push_pull_imbalance
            message = f"⚠️ Imbalance Alert: Your push-to-pull ratio is {ratio}:1 ({severity} risk). "
        
        message += f"{recommendation}"
        
        # Create in-app notification
        notification_data = {
            'user_id': user_id,
            'type': 'imbalance_alert',
            'title': 'Muscle Imbalance Detected',
            'message': message,
            'data': {
                'risk_type': risk_type,
                'severity': severity,
                'ratio': ratio,
                'recommendation': recommendation
            },
            'read': False,
            'created_at': datetime.now().isoformat()
        }
        
        supabase.table('notifications').insert(notification_data).execute()
        
        print(f"  ⚠️  Sent imbalance alert to user {user_id}: {risk_type} ({severity})")
        
    except Exception as e:
        print(f"  ❌ Error sending imbalance alert to user {user_id}: {e}")


def run_weekly_adherence_check():
    """
    Run weekly adherence check for all Premium users.
    
    This is the main cron job function.
    """
    print("\n" + "="*80)
    print("WEEKLY ADHERENCE CHECK - CRON JOB")
    print("="*80)
    print(f"Started at: {datetime.now().isoformat()}")
    
    try:
        # Initialize Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Error: Missing Supabase credentials")
            return
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Initialize adherence monitor
        monitor = ProgramAdherenceMonitor(supabase)
        
        # Get all Premium users
        premium_users = get_premium_users(supabase)
        
        if not premium_users:
            print("\n⚠️  No Premium users found with active programs")
            return
        
        # Track statistics
        total_users = len(premium_users)
        users_checked = 0
        users_with_alerts = 0
        total_alerts_sent = 0
        total_imbalance_alerts = 0
        errors = 0
        
        print(f"\n🔄 Processing {total_users} Premium users...")
        print("-" * 80)
        
        # Run adherence check for each user
        for user_id in premium_users:
            try:
                print(f"\n👤 Checking user: {user_id}")
                
                # Run weekly check
                report = monitor.run_weekly_check(user_id)
                
                if 'error' in report:
                    print(f"  ⚠️  Skipped: {report['error']}")
                    errors += 1
                    continue
                
                users_checked += 1
                
                # Send adherence alerts
                alerts = report['flags']['alerts_to_send']
                if alerts:
                    users_with_alerts += 1
                    print(f"  🚨 Sending {len(alerts)} adherence alerts...")
                    
                    for alert in alerts:
                        send_adherence_alert(supabase, user_id, alert)
                        total_alerts_sent += 1
                
                # Send imbalance alerts
                imbalance_risks = report['imbalance_risks']
                if imbalance_risks:
                    print(f"  ⚠️  Sending {len(imbalance_risks)} imbalance alerts...")
                    
                    for risk in imbalance_risks:
                        send_imbalance_alert(supabase, user_id, risk)
                        total_imbalance_alerts += 1
                
                if not alerts and not imbalance_risks:
                    print(f"  ✅ No alerts needed - adherence is good!")
                
            except Exception as e:
                print(f"  ❌ Error processing user {user_id}: {e}")
                errors += 1
                continue
        
        # Print summary
        print("\n" + "="*80)
        print("WEEKLY ADHERENCE CHECK - SUMMARY")
        print("="*80)
        print(f"Total Premium users: {total_users}")
        print(f"Users checked: {users_checked}")
        print(f"Users with alerts: {users_with_alerts}")
        print(f"Adherence alerts sent: {total_alerts_sent}")
        print(f"Imbalance alerts sent: {total_imbalance_alerts}")
        print(f"Errors: {errors}")
        print(f"\nCompleted at: {datetime.now().isoformat()}")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_weekly_adherence_check()

