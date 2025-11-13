"""
Notification Personality System - Duolingo-Inspired Notifications

This module generates personalized, contextual notifications with personality.

Features:
- Workout reminders (contextual to day's focus)
- Streak celebrations (3, 7, 14, 30 days)
- Missed workout (no guilt, encouraging)
- PR celebrations (immediate, exciting)
- Program completion (major milestone)
- Deload week reminders (explain why it's important)

Personality Traits:
- Friendly and motivating (not annoying)
- Contextual based on user's schedule
- Celebrates consistency without guilt-tripping
- Smart timing (based on user's typical workout time)
"""

import random
from typing import Dict, Any, Optional
from datetime import datetime


class NotificationPersonality:
    """
    Generates personalized, Duolingo-inspired notifications.
    
    All notifications maintain the same coach personality:
    - Conversational and natural
    - Encouraging and supportive
    - Contextual to user's situation
    - Never guilt-tripping or annoying
    """
    
    # Workout Reminder Templates
    WORKOUT_REMINDER = [
        "Hey {name}! Ready to crush {workout_focus} today? 💪",
        "{name}, your {workout_focus} workout is calling! Let's get it.",
        "Time to train, {name}! Today's focus: {workout_focus}",
        "Let's go, {name}! {workout_focus} day 🔥",
        "{workout_focus} time! Ready to make some gains, {name}?",
    ]
    
    # Streak Celebration Templates
    STREAK_3_DAYS = [
        "🔥 3 days in a row! You're building momentum, {name}!",
        "3-day streak! That's how consistency starts 💪",
        "Nice! 3 days straight, {name}. Keep it rolling!",
    ]
    
    STREAK_7_DAYS = [
        "🔥 7 days in a row! You're on fire, {name}!",
        "One week streak! 🎉 That's commitment, {name}!",
        "7 days straight! You're crushing it 💪",
    ]
    
    STREAK_14_DAYS = [
        "🔥 2 weeks in a row! You're unstoppable, {name}!",
        "14-day streak! 🏆 That's elite consistency!",
        "Two weeks straight! You're building something special, {name} 💪",
    ]
    
    STREAK_30_DAYS = [
        "🔥 30 DAYS IN A ROW! You're a legend, {name}! 👑",
        "ONE MONTH STREAK! 🎊 This is what champions are made of!",
        "30 days straight! You've officially built a habit, {name}! 💪",
    ]
    
    # Missed Workout (No Guilt)
    MISSED_WORKOUT_GENTLE = [
        "No worries, {name}! Life happens. Ready to get back at it today?",
        "Hey {name}! Missed you yesterday. Let's crush it today 💪",
        "{name}, your workout is waiting! No pressure, just progress.",
        "Ready when you are, {name}! Let's get back to it 🔥",
    ]
    
    # PR Celebration Templates
    PR_CELEBRATION = [
        "🎉 NEW PR! {exercise}: {weight} {unit} × {reps}. That's what I'm talking about, {name}!",
        "PR ALERT! 🚨 {exercise}: {weight} {unit} × {reps}. You're getting stronger!",
        "Boom! New {exercise} PR: {weight} {unit} × {reps}. Keep crushing it, {name}! 💪",
        "🔥 PR! {exercise}: {weight} {unit} × {reps}. Nice work, {name}!",
    ]
    
    # Program Completion
    PROGRAM_COMPLETION = [
        "🎊 PROGRAM COMPLETE! You just finished {program_name}. Time to celebrate, {name}!",
        "You did it, {name}! {program_name} is complete. Ready for what's next? 💪",
        "🏆 {program_name} DONE! That's {weeks} weeks of consistency. Proud of you, {name}!",
    ]
    
    # Deload Week Reminder
    DELOAD_WEEK = [
        "📉 Deload week, {name}! Time to recover and come back stronger 💪",
        "Hey {name}! This week is deload - lighter weights, same gains. Trust the process!",
        "Deload week! Your body needs this to grow, {name}. Embrace the recovery 🔥",
    ]
    
    # Rest Day Reminder
    REST_DAY = [
        "Rest day, {name}! Recovery is where the gains happen 💤",
        "No workout today, {name}. Your muscles are growing while you rest 💪",
        "Rest day! Enjoy it, {name}. You've earned it 🔥",
    ]
    
    def generate_workout_reminder(
        self,
        user_name: str,
        workout_focus: str
    ) -> str:
        """
        Generate a workout reminder notification.
        
        Args:
            user_name: User's first name
            workout_focus: Today's workout focus (e.g., "Upper Body", "Squat Day")
        
        Returns:
            Personalized workout reminder message
        """
        template = random.choice(self.WORKOUT_REMINDER)
        return template.format(name=user_name, workout_focus=workout_focus)
    
    def generate_streak_celebration(
        self,
        user_name: str,
        streak_days: int
    ) -> str:
        """
        Generate a streak celebration notification.
        
        Args:
            user_name: User's first name
            streak_days: Number of consecutive days
        
        Returns:
            Personalized streak celebration message
        """
        if streak_days >= 30:
            templates = self.STREAK_30_DAYS
        elif streak_days >= 14:
            templates = self.STREAK_14_DAYS
        elif streak_days >= 7:
            templates = self.STREAK_7_DAYS
        elif streak_days >= 3:
            templates = self.STREAK_3_DAYS
        else:
            return None  # Don't celebrate streaks < 3 days
        
        template = random.choice(templates)
        return template.format(name=user_name)
    
    def generate_missed_workout_reminder(
        self,
        user_name: str
    ) -> str:
        """
        Generate a gentle missed workout reminder (no guilt).

        Args:
            user_name: User's first name

        Returns:
            Encouraging reminder message
        """
        template = random.choice(self.MISSED_WORKOUT_GENTLE)
        return template.format(name=user_name)

    def generate_pr_celebration(
        self,
        user_name: str,
        exercise: str,
        weight: float,
        unit: str,
        reps: int
    ) -> str:
        """
        Generate a PR celebration notification.

        Args:
            user_name: User's first name
            exercise: Exercise name
            weight: Weight lifted
            unit: Weight unit (lbs/kg)
            reps: Reps completed

        Returns:
            Exciting PR celebration message
        """
        template = random.choice(self.PR_CELEBRATION)
        return template.format(
            name=user_name,
            exercise=exercise,
            weight=weight,
            unit=unit,
            reps=reps
        )

    def generate_program_completion(
        self,
        user_name: str,
        program_name: str,
        weeks: int
    ) -> str:
        """
        Generate a program completion celebration.

        Args:
            user_name: User's first name
            program_name: Name of completed program
            weeks: Number of weeks in program

        Returns:
            Celebratory program completion message
        """
        template = random.choice(self.PROGRAM_COMPLETION)
        return template.format(
            name=user_name,
            program_name=program_name,
            weeks=weeks
        )

    def generate_deload_week_reminder(
        self,
        user_name: str
    ) -> str:
        """
        Generate a deload week reminder (explain why it's important).

        Args:
            user_name: User's first name

        Returns:
            Educational deload week reminder
        """
        template = random.choice(self.DELOAD_WEEK)
        return template.format(name=user_name)

    def generate_rest_day_reminder(
        self,
        user_name: str
    ) -> str:
        """
        Generate a rest day reminder.

        Args:
            user_name: User's first name

        Returns:
            Encouraging rest day message
        """
        template = random.choice(self.REST_DAY)
        return template.format(name=user_name)

