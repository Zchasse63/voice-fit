"""
Program Adherence Monitor Service

Monitors user adherence to custom training programs and detects muscle group imbalances.

Two-Stage Monitoring System:
1. Stage 1 (Week 1): Silent monitoring - flag muscle groups below target
2. Stage 2 (Week 2): If still below target after 7 days, send check-in alert

Imbalance Detection:
- Quad/Hamstring ratio: Safe 1:1 to 1.5:1, Risk >2:1
- Push/Pull ratio: Safe 1:1 to 1.2:1, Risk >1.5:1

Premium Feature - Requires Premium tier
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, timezone
from supabase import Client


class ProgramAdherenceMonitor:
    """
    Service for monitoring program adherence and detecting imbalances.
    
    Features:
    - Calculate weekly volume by muscle group
    - Compare actual vs program targets
    - Two-stage flagging (silent monitoring → alert)
    - Imbalance risk detection
    - Gradual adjustment plan creation
    """
    
    # Muscle group mappings for imbalance detection
    QUAD_MUSCLES = ['quads', 'quadriceps']
    HAMSTRING_MUSCLES = ['hamstrings', 'hamstring']
    PUSH_MUSCLES = ['chest', 'shoulders', 'triceps', 'pectorals', 'deltoids']
    PULL_MUSCLES = ['back', 'biceps', 'lats', 'traps', 'rhomboids']
    
    # Priority-based thresholds (variance percentage)
    THRESHOLDS = {
        'high': -20,      # Alert if 20%+ below target
        'medium': -30,    # Alert if 30%+ below target
        'low': -40        # Alert if 40%+ below target
    }
    
    # Imbalance risk thresholds
    QUAD_HAM_SAFE_MAX = 1.5   # Quad/Ham ratio
    QUAD_HAM_RISK = 2.0
    PUSH_PULL_SAFE_MAX = 1.2  # Push/Pull ratio
    PUSH_PULL_RISK = 1.5
    
    def __init__(self, supabase: Client):
        """Initialize the adherence monitor"""
        self.supabase = supabase
    
    def calculate_weekly_volume(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """
        Calculate actual weekly volume by muscle group.
        
        Args:
            user_id: User ID
            start_date: Start of week (defaults to last Monday)
            end_date: End of week (defaults to next Sunday)
        
        Returns:
            Dictionary mapping muscle group to total sets
            Example: {'chest': 16, 'back': 18, 'legs': 20}
        """
        # Default to current week (Monday to Sunday)
        if not start_date:
            today = datetime.now()
            start_date = today - timedelta(days=today.weekday())  # Last Monday
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if not end_date:
            end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        # Fetch workouts in date range
        workouts_result = self.supabase.table('workouts')\
            .select('id')\
            .eq('user_id', user_id)\
            .gte('start_time', start_date.isoformat())\
            .lte('start_time', end_date.isoformat())\
            .execute()
        
        workouts = workouts_result.data if workouts_result.data else []
        workout_ids = [w['id'] for w in workouts]
        
        if not workout_ids:
            return {}
        
        # Fetch all sets for these workouts with exercise data
        sets_result = self.supabase.table('workout_logs')\
            .select('*, exercises!inner(primary_muscles, secondary_muscles)')\
            .in_('workout_id', workout_ids)\
            .execute()
        
        sets_data = sets_result.data if sets_result.data else []
        
        # Calculate volume by muscle group
        volume_by_muscle = {}
        
        for set_log in sets_data:
            exercise = set_log.get('exercises', {})
            primary_muscles = exercise.get('primary_muscles', [])
            secondary_muscles = exercise.get('secondary_muscles', [])
            
            # Count as 1 set for primary muscles
            for muscle in primary_muscles:
                muscle_lower = muscle.lower()
                volume_by_muscle[muscle_lower] = volume_by_muscle.get(muscle_lower, 0) + 1
            
            # Count as 0.5 sets for secondary muscles
            for muscle in secondary_muscles:
                muscle_lower = muscle.lower()
                volume_by_muscle[muscle_lower] = volume_by_muscle.get(muscle_lower, 0) + 0.5
        
        # Round to integers
        return {k: int(v) for k, v in volume_by_muscle.items()}
    
    def get_program_targets(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get program targets for user.

        Returns:
            Dictionary with:
            - weekly_volume_targets: {muscle_group: target_sets}
            - body_part_emphasis: {muscle_group: priority}
            - program_id: UUID
        """
        # First get user's profile ID
        profile_result = self.supabase.table('user_profiles')\
            .select('id')\
            .eq('user_id', user_id)\
            .single()\
            .execute()

        if not profile_result.data:
            return None

        profile_id = profile_result.data['id']

        # Get user's most recent program
        result = self.supabase.table('generated_programs')\
            .select('id, weekly_volume_targets, body_part_emphasis')\
            .eq('user_profile_id', profile_id)\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
        
        if not result.data:
            return None
        
        program = result.data[0]
        return {
            'program_id': program['id'],
            'weekly_volume_targets': program.get('weekly_volume_targets', {}),
            'body_part_emphasis': program.get('body_part_emphasis', {})
        }
    
    def check_adherence(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Check user's adherence to their program.
        
        Returns:
            Dictionary with:
            - flagged_muscles: List of muscle groups below threshold
            - actual_volume: {muscle_group: actual_sets}
            - target_volume: {muscle_group: target_sets}
            - variance: {muscle_group: variance_percentage}
            - imbalance_risks: List of detected imbalances
        """
        # Get program targets
        program_data = self.get_program_targets(user_id)
        if not program_data:
            return {
                'error': 'No program found for user',
                'flagged_muscles': [],
                'imbalance_risks': []
            }
        
        targets = program_data['weekly_volume_targets']
        priorities = program_data['body_part_emphasis']
        
        # Calculate actual volume
        actual = self.calculate_weekly_volume(user_id, start_date, end_date)
        
        # Calculate variance and flag muscles below threshold
        flagged_muscles = []
        variance = {}
        
        for muscle, target_sets in targets.items():
            actual_sets = actual.get(muscle, 0)
            variance_pct = ((actual_sets - target_sets) / target_sets * 100) if target_sets > 0 else 0
            variance[muscle] = variance_pct
            
            # Get priority for this muscle
            priority = priorities.get(muscle, 'medium')
            threshold = self.THRESHOLDS.get(priority, -30)
            
            # Flag if below threshold
            if variance_pct < threshold:
                flagged_muscles.append({
                    'muscle_group': muscle,
                    'priority': priority,
                    'target_weekly_sets': target_sets,
                    'actual_weekly_sets': actual_sets,
                    'variance_percentage': variance_pct
                })
        
        # Check for imbalance risks
        imbalance_risks = self.check_imbalance_risks(actual)
        
        return {
            'flagged_muscles': flagged_muscles,
            'actual_volume': actual,
            'target_volume': targets,
            'variance': variance,
            'imbalance_risks': imbalance_risks,
            'program_id': program_data['program_id']
        }
    
    def check_imbalance_risks(self, volume_by_muscle: Dict[str, int]) -> List[Dict[str, Any]]:
        """
        Detect dangerous muscle group imbalances.
        
        Checks:
        1. Quad/Hamstring ratio (injury risk if >2:1)
        2. Push/Pull ratio (shoulder injury risk if >1.5:1)
        
        Returns:
            List of imbalance risks with severity and recommendations
        """
        risks = []
        
        # Calculate quad volume
        quad_volume = sum(volume_by_muscle.get(m, 0) for m in self.QUAD_MUSCLES)
        
        # Calculate hamstring volume
        ham_volume = sum(volume_by_muscle.get(m, 0) for m in self.HAMSTRING_MUSCLES)
        
        # Check quad/ham ratio
        if ham_volume > 0:
            quad_ham_ratio = quad_volume / ham_volume
            
            if quad_ham_ratio > self.QUAD_HAM_RISK:
                risks.append({
                    'type': 'quad_hamstring_imbalance',
                    'severity': 'high',
                    'ratio': round(quad_ham_ratio, 2),
                    'quad_sets': quad_volume,
                    'hamstring_sets': ham_volume,
                    'recommendation': f'Quad/hamstring ratio is {quad_ham_ratio:.1f}:1 (high injury risk). Increase hamstring volume or reduce quad volume.'
                })
            elif quad_ham_ratio > self.QUAD_HAM_SAFE_MAX:
                risks.append({
                    'type': 'quad_hamstring_imbalance',
                    'severity': 'medium',
                    'ratio': round(quad_ham_ratio, 2),
                    'quad_sets': quad_volume,
                    'hamstring_sets': ham_volume,
                    'recommendation': f'Quad/hamstring ratio is {quad_ham_ratio:.1f}:1 (moderate risk). Consider balancing quad and hamstring volume.'
                })
        
        # Calculate push volume
        push_volume = sum(volume_by_muscle.get(m, 0) for m in self.PUSH_MUSCLES)
        
        # Calculate pull volume
        pull_volume = sum(volume_by_muscle.get(m, 0) for m in self.PULL_MUSCLES)
        
        # Check push/pull ratio
        if pull_volume > 0:
            push_pull_ratio = push_volume / pull_volume
            
            if push_pull_ratio > self.PUSH_PULL_RISK:
                risks.append({
                    'type': 'push_pull_imbalance',
                    'severity': 'high',
                    'ratio': round(push_pull_ratio, 2),
                    'push_sets': push_volume,
                    'pull_sets': pull_volume,
                    'recommendation': f'Push/pull ratio is {push_pull_ratio:.1f}:1 (shoulder injury risk). Increase pulling volume or reduce pushing volume.'
                })
            elif push_pull_ratio > self.PUSH_PULL_SAFE_MAX:
                risks.append({
                    'type': 'push_pull_imbalance',
                    'severity': 'medium',
                    'ratio': round(push_pull_ratio, 2),
                    'push_sets': push_volume,
                    'pull_sets': pull_volume,
                    'recommendation': f'Push/pull ratio is {push_pull_ratio:.1f}:1 (moderate risk). Consider balancing push and pull volume.'
                })
        
        return risks

    def manage_flags(
        self,
        user_id: str,
        flagged_muscles: List[Dict[str, Any]],
        check_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Create, update, or resolve adherence flags.

        Two-stage logic:
        1. Create new flags with status='monitoring' (silent)
        2. Update existing flags to status='alerted' if 7+ days old
        3. Resolve flags if user has improved

        Args:
            user_id: User ID
            flagged_muscles: List of flagged muscle groups from check_adherence()
            check_date: Date of check (defaults to now)

        Returns:
            Dictionary with created, updated, and resolved flags
        """
        if not check_date:
            check_date = datetime.now(timezone.utc)

        # Get existing flags for this user
        existing_flags_result = self.supabase.table('program_adherence_flags')\
            .select('*')\
            .eq('user_id', user_id)\
            .in_('status', ['monitoring', 'alerted'])\
            .execute()

        existing_flags = existing_flags_result.data if existing_flags_result.data else []
        existing_by_muscle = {f['muscle_group']: f for f in existing_flags}

        created_flags = []
        updated_flags = []
        resolved_flags = []
        alerts_to_send = []

        # Process flagged muscles
        flagged_muscle_names = {f['muscle_group'] for f in flagged_muscles}

        for flagged in flagged_muscles:
            muscle = flagged['muscle_group']

            if muscle in existing_by_muscle:
                # Update existing flag
                existing_flag = existing_by_muscle[muscle]
                flag_id = existing_flag['id']
                flagged_date = datetime.fromisoformat(existing_flag['flagged_date'].replace('Z', '+00:00'))
                days_since_flagged = (check_date - flagged_date).days

                # If 7+ days and still monitoring, send alert
                if days_since_flagged >= 7 and existing_flag['status'] == 'monitoring':
                    update_data = {
                        'status': 'alerted',
                        'alerted_at': check_date.isoformat(),
                        'actual_weekly_sets': flagged['actual_weekly_sets'],
                        'variance_percentage': flagged['variance_percentage'],
                        'updated_at': check_date.isoformat()
                    }

                    self.supabase.table('program_adherence_flags')\
                        .update(update_data)\
                        .eq('id', flag_id)\
                        .execute()

                    updated_flags.append({**existing_flag, **update_data})
                    alerts_to_send.append({**existing_flag, **update_data})

                # Otherwise just update the numbers
                else:
                    update_data = {
                        'actual_weekly_sets': flagged['actual_weekly_sets'],
                        'variance_percentage': flagged['variance_percentage'],
                        'updated_at': check_date.isoformat()
                    }

                    self.supabase.table('program_adherence_flags')\
                        .update(update_data)\
                        .eq('id', flag_id)\
                        .execute()

                    updated_flags.append({**existing_flag, **update_data})

            else:
                # Create new flag (silent monitoring)
                new_flag = {
                    'user_id': user_id,
                    'muscle_group': muscle,
                    'priority': flagged['priority'],
                    'target_weekly_sets': flagged['target_weekly_sets'],
                    'actual_weekly_sets': flagged['actual_weekly_sets'],
                    'variance_percentage': flagged['variance_percentage'],
                    'flagged_date': check_date.isoformat(),
                    'status': 'monitoring'
                }

                result = self.supabase.table('program_adherence_flags')\
                    .insert(new_flag)\
                    .execute()

                if result.data:
                    created_flags.append(result.data[0])

        # Resolve flags for muscles that are no longer flagged
        for muscle, existing_flag in existing_by_muscle.items():
            if muscle not in flagged_muscle_names:
                flag_id = existing_flag['id']

                update_data = {
                    'status': 'resolved',
                    'resolved_at': check_date.isoformat(),
                    'updated_at': check_date.isoformat()
                }

                self.supabase.table('program_adherence_flags')\
                    .update(update_data)\
                    .eq('id', flag_id)\
                    .execute()

                resolved_flags.append({**existing_flag, **update_data})

        return {
            'created': created_flags,
            'updated': updated_flags,
            'resolved': resolved_flags,
            'alerts_to_send': alerts_to_send
        }

    def create_adjustment_plan(
        self,
        user_id: str,
        muscle_group: str,
        current_sets: int,
        target_sets: int,
        duration_weeks: int = 4
    ) -> Dict[str, Any]:
        """
        Create a gradual volume adjustment plan.

        Instead of jumping from current to target immediately,
        create a 4-week gradual increase plan.

        Example: 10 → 12 → 14 → 16 sets over 4 weeks

        Args:
            user_id: User ID
            muscle_group: Muscle group to adjust
            current_sets: Current weekly sets
            target_sets: Target weekly sets
            duration_weeks: Duration of adjustment (default 4 weeks)

        Returns:
            Created adjustment plan
        """
        # Calculate weekly increment
        total_increase = target_sets - current_sets
        weekly_increment = max(1, round(total_increase / duration_weeks))

        # Calculate start and end dates
        start_date = datetime.now().date()
        end_date = start_date + timedelta(weeks=duration_weeks)

        # Create plan
        plan_data = {
            'user_id': user_id,
            'muscle_group': muscle_group,
            'current_weekly_sets': current_sets,
            'target_weekly_sets': target_sets,
            'weekly_increment': weekly_increment,
            'duration_weeks': duration_weeks,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'status': 'active'
        }

        result = self.supabase.table('volume_adjustment_plans')\
            .insert(plan_data)\
            .execute()

        if result.data:
            return result.data[0]

        return {}

    def get_active_plans(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's active adjustment plans"""
        result = self.supabase.table('volume_adjustment_plans')\
            .select('*')\
            .eq('user_id', user_id)\
            .eq('status', 'active')\
            .execute()

        return result.data if result.data else []

    def run_weekly_check(self, user_id: str) -> Dict[str, Any]:
        """
        Run complete weekly adherence check for a user.

        This is the main method called by the weekly cron job.

        Steps:
        1. Check adherence (compare actual vs target)
        2. Manage flags (create/update/resolve)
        3. Check imbalance risks
        4. Return alerts to send to user

        Returns:
            Complete adherence report with alerts
        """
        # Check adherence
        adherence_data = self.check_adherence(user_id)

        if 'error' in adherence_data:
            return adherence_data

        # Manage flags
        flag_results = self.manage_flags(user_id, adherence_data['flagged_muscles'])

        # Combine results
        return {
            'user_id': user_id,
            'check_date': datetime.now(timezone.utc).isoformat(),
            'adherence': {
                'actual_volume': adherence_data['actual_volume'],
                'target_volume': adherence_data['target_volume'],
                'variance': adherence_data['variance']
            },
            'flags': {
                'created': flag_results['created'],
                'updated': flag_results['updated'],
                'resolved': flag_results['resolved'],
                'alerts_to_send': flag_results['alerts_to_send']
            },
            'imbalance_risks': adherence_data['imbalance_risks'],
            'needs_user_action': len(flag_results['alerts_to_send']) > 0 or len(adherence_data['imbalance_risks']) > 0
        }

