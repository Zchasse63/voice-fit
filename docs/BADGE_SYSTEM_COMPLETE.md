# 🏆 VoiceFit Complete Badge System (Premium Feature)

## Overview

Research-backed gamification system with **~90 badges** across strength training, running, and hybrid achievements. Based on analysis of Nike Run Club, Strava, Peloton, JEFIT, and Duolingo.

**Key Differentiators:**
- ✅ **Hybrid badges** (strength + running) - No competitor does this!
- ✅ **Plate milestones** (1-plate, 2-plate, 3-plate) - More intuitive than raw numbers
- ✅ **Weekly consistency** - More sustainable than daily streaks
- ✅ **Weather warrior** - Unique to running apps with weather tracking

---

## 🏋️ Strength Training Badges (30 total)

### **Workout Count Milestones (9 badges)**
- 🎯 **First Workout** - Complete your first workout
- 🏃 **5 Workouts** - Complete 5 workouts (early win!)
- 💪 **10 Workouts** - Complete 10 workouts
- 🔥 **25 Workouts** - Complete 25 workouts
- ⭐ **50 Workouts** - Complete 50 workouts
- 🏆 **100 Workouts** - Complete 100 workouts
- 💎 **250 Workouts** - Complete 250 workouts
- 👑 **500 Workouts** - Complete 500 workouts
- 🌟 **1,000 Workouts** - Complete 1,000 workouts

**Badge Type:** `workout_count_X` (e.g., `workout_count_10`)
**Research:** Based on Peloton's milestone system (5, 10, 25, 50, 100, 250, 500, 1000)

---

### **Volume Milestones - Total Tonnage (8 badges)**
- 🏋️ **50K Club** - Lift 50,000 lbs total (early win!)
- 💪 **100K Club** - Lift 100,000 lbs total
- 🔥 **250K Club** - Lift 250,000 lbs total
- ⭐ **500K Club** - Lift 500,000 lbs total
- 🏆 **1M Club** - Lift 1,000,000 lbs total
- 💎 **2.5M Club** - Lift 2,500,000 lbs total
- 👑 **5M Club** - Lift 5,000,000 lbs total
- 🌟 **10M Club** - Lift 10,000,000 lbs total

**Badge Type:** `volume_milestone_X` (e.g., `volume_milestone_100k`)
**Research:** Based on JEFIT/Strong tonnage tracking

---

### **PR Milestones (8 badges)**
- 🎉 **First PR** - Hit your first personal record
- 🏃 **5 PRs** - Hit 5 personal records (early win!)
- 💪 **10 PRs** - Hit 10 personal records
- 🔥 **25 PRs** - Hit 25 personal records
- ⭐ **50 PRs** - Hit 50 personal records
- 🏆 **100 PRs** - Hit 100 personal records
- 💎 **250 PRs** - Hit 250 personal records
- 👑 **500 PRs** - Hit 500 personal records

**Badge Type:** `pr_count_X` (e.g., `pr_count_10`)
**Research:** Progressive milestones based on Peloton's system

---

### **Plate Milestones (9 badges)**
**More intuitive than raw numbers - based on powerlifting culture**

**Bench Press:**
- 🏋️ **1-Plate Bench** - 135 lbs bench press (1 plate per side)
- 💪 **2-Plate Bench** - 225 lbs bench press (2 plates per side)
- 🏆 **3-Plate Bench** - 315 lbs bench press (3 plates per side)

**Squat:**
- 🦵 **2-Plate Squat** - 225 lbs squat (2 plates per side)
- 💪 **3-Plate Squat** - 315 lbs squat (3 plates per side)
- 🏆 **4-Plate Squat** - 405 lbs squat (4 plates per side)

**Deadlift:**
- 💪 **3-Plate Deadlift** - 315 lbs deadlift (3 plates per side)
- 🏆 **4-Plate Deadlift** - 405 lbs deadlift (4 plates per side)
- 👑 **5-Plate Deadlift** - 495 lbs deadlift (5 plates per side)

**Badge Type:** `plate_milestone_X` (e.g., `plate_milestone_bench_2`)
**Research:** Based on powerlifting community standards (ExRx, Strength Level)

---

### **Total Strength Clubs (2 badges)**
**Combined Squat + Bench + Deadlift 1RM**

- 🏋️ **1000-Pound Club** - Total ≥ 1000 lbs (achieved by <10% of gym-goers)
- 👑 **1500-Pound Club** - Total ≥ 1500 lbs (elite natural lifter)

**Badge Type:** `total_strength_club_X` (e.g., `total_strength_club_1000`)
**Research:** Based on powerlifting community standards

---

## 🏃 Running Badges (40 total)

### **Total Distance Milestones (8 badges)**
- 🏃 **First Mile** - Run your first mile
- 🎯 **10 Miles** - Run 10 miles total
- 💪 **50 Miles** - Run 50 miles total
- 🔥 **100 Miles** - Run 100 miles total
- ⭐ **250 Miles** - Run 250 miles total
- 🏆 **500 Miles** - Run 500 miles total
- 💎 **1,000 Miles** - Run 1,000 miles total
- 👑 **2,500 Miles** - Run 2,500 miles total (Nike Run Club "Black Level")

**Badge Type:** `run_distance_total_X` (e.g., `run_distance_total_100`)
**Research:** Based on Nike Run Club level system

---

### **Single Run Distance Achievements (7 badges)**
- 🏃 **5K Finisher** - Complete a 5K run (3.1 miles)
- 🎯 **10K Finisher** - Complete a 10K run (6.2 miles)
- 💪 **15K Finisher** - Complete a 15K run (9.3 miles)
- 🔥 **Half Marathon** - Complete a half marathon (13.1 miles)
- ⭐ **20 Miler** - Complete a 20-mile run
- 🏆 **Marathon** - Complete a marathon (26.2 miles)
- 👑 **Ultra Runner** - Complete a 50K+ run (31+ miles)

**Badge Type:** `run_distance_single_X` (e.g., `run_distance_single_5k`)
**Research:** Based on Strava's "Best Efforts" distances

---

### **5K Speed Achievements (6 badges)**
- 🏃 **5K Sub-30** - Run 5K in under 30 minutes (9:40/mile - beginner)
- 💪 **5K Sub-27** - Run 5K in under 27 minutes (8:42/mile)
- 🔥 **5K Sub-25** - Run 5K in under 25 minutes (8:03/mile - intermediate)
- ⭐ **5K Sub-22** - Run 5K in under 22 minutes (7:05/mile)
- 🏆 **5K Sub-20** - Run 5K in under 20 minutes (6:26/mile - advanced)
- 👑 **5K Sub-18** - Run 5K in under 18 minutes (5:47/mile - elite)

**Badge Type:** `run_speed_5k_X` (e.g., `run_speed_5k_sub_25`)
**Research:** Based on real-world running benchmarks from r/running community

---

### **10K Speed Achievements (5 badges)**
- 🏃 **10K Sub-60** - Run 10K in under 60 minutes (9:40/mile - beginner)
- 💪 **10K Sub-55** - Run 10K in under 55 minutes (8:51/mile)
- 🔥 **10K Sub-50** - Run 10K in under 50 minutes (8:03/mile - intermediate)
- ⭐ **10K Sub-45** - Run 10K in under 45 minutes (7:15/mile - advanced)
- 🏆 **10K Sub-40** - Run 10K in under 40 minutes (6:26/mile - elite)

**Badge Type:** `run_speed_10k_X` (e.g., `run_speed_10k_sub_50`)

---

### **Mile Speed Achievements (5 badges)**
- 🏃 **Mile Sub-10** - Run 1 mile in under 10 minutes (beginner)
- 💪 **Mile Sub-9** - Run 1 mile in under 9 minutes
- 🔥 **Mile Sub-8** - Run 1 mile in under 8 minutes (intermediate)
- ⭐ **Mile Sub-7** - Run 1 mile in under 7 minutes (advanced)
- 🏆 **Mile Sub-6** - Run 1 mile in under 6 minutes (elite - very rare!)

**Badge Type:** `run_speed_mile_X` (e.g., `run_speed_mile_sub_8`)
**Note:** Sub-5 minute mile excluded (fewer people than have summited Everest!)

---

### **Average Pace Achievements (4 badges)**
**For any run ≥ 3 miles**
- 🏃 **Sub-10 Pace** - Average pace under 10:00/mile
- 🔥 **Sub-9 Pace** - Average pace under 9:00/mile
- ⭐ **Sub-8 Pace** - Average pace under 8:00/mile
- 🏆 **Sub-7 Pace** - Average pace under 7:00/mile (elite)

**Badge Type:** `run_pace_X` (e.g., `run_pace_sub_8`)

---

### **Elevation Achievements (4 badges)**
- ⛰️ **Hill Climber** - 500 ft elevation gain in single run
- 🏔️ **Mountain Goat** - 1,000 ft elevation gain in single run
- 🗻 **Peak Bagger** - 2,500 ft elevation gain in single run
- 🚁 **Summit Seeker** - 5,000 ft elevation gain in single run

**Badge Type:** `run_elevation_X` (e.g., `run_elevation_hill_climber`)

---

### **Weather Warrior Badges (3 badges)**
**Unique to VoiceFit - leverages weather tracking**
- 🌧️ **Rain Runner** - Complete 10 runs in the rain
- ❄️ **Cold Warrior** - Complete 10 runs in <32°F weather
- 🔥 **Heat Champion** - Complete 10 runs in >90°F weather

**Badge Type:** `run_weather_X` (e.g., `run_weather_rain`)

---

## 🔥 Streak Badges (12 total)

### **Workout Streaks (6 badges)**
**Daily consecutive workouts**
- 🔥 **7-Day Streak** - Train 7 consecutive days
- 💪 **14-Day Streak** - Train 14 consecutive days
- ⭐ **30-Day Streak** - Train 30 consecutive days (habit formation!)
- 🏆 **60-Day Streak** - Train 60 consecutive days
- 💎 **100-Day Streak** - Train 100 consecutive days (rare achievement!)
- 👑 **365-Day Streak** - Train 365 consecutive days (elite consistency!)

**Badge Type:** `workout_streak_X` (e.g., `workout_streak_30`)
**Research:** Based on Duolingo's streak system (7, 14, 30, 50, 100, 365)

---

### **Weekly Consistency (4 badges)**
**More sustainable than daily streaks - at least 1 workout per week**
- 📅 **4-Week Warrior** - Train at least once per week for 4 weeks
- 🗓️ **12-Week Champion** - Train at least once per week for 12 weeks
- 📆 **26-Week Master** - Train at least once per week for 26 weeks
- 🏆 **52-Week Legend** - Train at least once per week for 52 weeks

**Badge Type:** `weekly_consistency_X` (e.g., `weekly_consistency_12`)
**Research:** Based on Peloton's weekly streak system

---

### **Run Streaks (3 badges)**
**Daily consecutive runs**
- 🏃 **7-Day Run Streak** - Run 7 consecutive days
- 🔥 **30-Day Run Streak** - Run 30 consecutive days
- 💎 **100-Day Run Streak** - Run 100 consecutive days

**Badge Type:** `run_streak_X` (e.g., `run_streak_30`)
**Note:** 365-day run streak excluded (too stressful/injury risk)

---

## 🎯 Hybrid Achievements (8 total)

### **Cross-Training Badges (3 badges)**
**Unique to VoiceFit - no competitor does this!**
- 🏋️🏃 **Hybrid Athlete** - Complete 25 workouts AND 25 runs
- 💪🏃 **Iron Runner** - Complete 100 workouts AND 100 runs
- 🏆🏃 **Ultimate Athlete** - Complete 500 workouts AND 500 runs

**Badge Type:** `hybrid_cross_training_X` (e.g., `hybrid_cross_training_100`)

---

### **Iron Athlete Badges (2 badges)**
**Strength + Endurance combined**
- 💪🏃 **Iron Athlete Bronze** - Hit 50 PRs AND run 250 miles
- 🏆🏃 **Iron Athlete Gold** - Hit 100 PRs AND run 500 miles

**Badge Type:** `hybrid_iron_athlete_X` (e.g., `hybrid_iron_athlete_bronze`)

---

### **Program Completion Badges (4 badges)**
**Rewards following AI-generated programs**
- ✅ **First Program Complete** - Complete your first 12-week program
- 🎯 **3 Programs Complete** - Complete 3 programs
- 🏆 **5 Programs Complete** - Complete 5 programs
- 👑 **10 Programs Complete** - Complete 10 programs

**Badge Type:** `program_complete_X` (e.g., `program_complete_5`)

---

## 📊 Database Schema

### **`user_badges` Table**
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,  -- 'workout_count_10', 'run_speed_5k_sub_25', etc.
  badge_name TEXT NOT NULL,  -- "10 Workouts", "5K Sub-25", etc.
  badge_description TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example:**
```json
{
  "badge_type": "run_speed_5k_sub_25",
  "badge_name": "5K Sub-25",
  "badge_description": "Completed a 5K run in under 25 minutes",
  "earned_at": "2025-01-15T10:30:00Z"
}
```

---

## 🔧 Badge Detection Logic

### **Strength Training Badges**
**Triggered by:**
- Workout completion → Check workout count
- PR detection → Check PR count, exercise mastery
- Weekly volume calculation → Check volume milestones, body part specialists
- Daily streak check → Check streak milestones

### **Running Badges**
**Triggered by:**
- Run completion → Check:
  - Total distance milestones
  - Single run distance achievements
  - Speed achievements (5K, 10K, mile times)
  - Pace achievements
  - Elevation achievements
  - Weather warrior badges
- Daily run streak check → Check run streak milestones
- Weekly consistency check → Check consistency badges

---

## 🎨 Badge Display

### **Home Screen - Recent Badges**
```
🏆 Recent Achievements
┌─────────────────────────────┐
│ 🔥 7-Day Streak             │
│ Earned 2 days ago           │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 🏃 5K Sub-25                │
│ Earned 5 days ago           │
└─────────────────────────────┘
```

### **PRs Tab - Badge Collection**
```
🏆 Badge Collection (23/150)

STRENGTH TRAINING
✅ First Workout
✅ 10 Workouts
✅ 50 Workouts
⬜ 100 Workouts (73/100)
⬜ 500 Workouts

RUNNING
✅ First Mile
✅ 5K Finisher
✅ 5K Sub-30
✅ 5K Sub-25
⬜ 5K Sub-20 (Current: 24:32)
```

---

## 🚀 Implementation Plan

### **Backend Service: `BadgeService`**
**File:** `apps/backend/badge_service.py`

**Methods:**
- `check_workout_badges(user_id)` - Check after workout completion
- `check_pr_badges(user_id)` - Check after PR detection
- `check_run_badges(user_id, run_data)` - Check after run completion
- `check_streak_badges(user_id)` - Daily check for streaks
- `award_badge(user_id, badge_type)` - Award badge and send notification
- `get_user_badges(user_id)` - Get all earned badges
- `get_badge_progress(user_id)` - Get progress toward unearned badges

---

## ✅ Summary

### **Total: ~90 Badges**

**Strength Training (30 badges):**
- ✅ Workout count (9 badges): 1, 5, 10, 25, 50, 100, 250, 500, 1000
- ✅ Volume/tonnage (8 badges): 50K, 100K, 250K, 500K, 1M, 2.5M, 5M, 10M lbs
- ✅ PR count (8 badges): 1, 5, 10, 25, 50, 100, 250, 500
- ✅ Plate milestones (9 badges): 1/2/3-plate bench, 2/3/4-plate squat, 3/4/5-plate deadlift
- ✅ Total strength clubs (2 badges): 1000-lb club, 1500-lb club

**Running (40 badges):**
- ✅ Total distance (8 badges): 1, 10, 50, 100, 250, 500, 1000, 2500 miles
- ✅ Single run distance (7 badges): 5K, 10K, 15K, half, 20mi, marathon, ultra
- ✅ 5K speed (6 badges): Sub-30, 27, 25, 22, 20, 18
- ✅ 10K speed (5 badges): Sub-60, 55, 50, 45, 40
- ✅ Mile speed (5 badges): Sub-10, 9, 8, 7, 6
- ✅ Average pace (4 badges): Sub-10, 9, 8, 7 min/mile
- ✅ Elevation (4 badges): 500, 1000, 2500, 5000 ft
- ✅ Weather warrior (3 badges): Rain, cold, heat

**Streaks (12 badges):**
- ✅ Workout streaks (6 badges): 7, 14, 30, 60, 100, 365 days
- ✅ Weekly consistency (4 badges): 4, 12, 26, 52 weeks
- ✅ Run streaks (3 badges): 7, 30, 100 days

**Hybrid (8 badges):**
- ✅ Cross-training (3 badges): 25+25, 100+100, 500+500
- ✅ Iron athlete (2 badges): 50 PRs + 250mi, 100 PRs + 500mi
- ✅ Program completion (4 badges): 1, 3, 5, 10 programs

---

### **Key Differentiators from Competitors:**

1. **Hybrid Badges** - No competitor combines strength + running achievements
2. **Plate Milestones** - More intuitive than raw numbers (1-plate, 2-plate, 3-plate)
3. **Weekly Consistency** - More sustainable than daily streaks (Peloton-inspired)
4. **Weather Warrior** - Unique to apps with weather tracking
5. **Program Completion** - Rewards following AI-generated programs
6. **Research-Backed Standards** - Based on real-world data from millions of users

---

**Status:** ✅ Research-backed badge system designed - ready to implement

