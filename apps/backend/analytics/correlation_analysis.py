"""
Correlation Analysis Script
Analyzes the relationship between Sleep Duration and RPE (Rate of Perceived Exertion).
"""

import os
import json
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pandas as pd

# Mock data generator for testing (replace with DB calls later)
def get_mock_data(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
    data = []
    base_date = datetime.now()
    
    for i in range(days):
        date = (base_date - timedelta(days=i)).strftime("%Y-%m-%d")
        
        # Simulate: Less sleep -> Higher RPE for same relative intensity
        sleep_hours = np.random.normal(7.5, 1.0) # Mean 7.5h, SD 1.0
        sleep_hours = max(4, min(10, sleep_hours)) # Clamp between 4 and 10
        
        # RPE base is 7, increases if sleep is low
        rpe_base = 7
        rpe_modifier = (8 - sleep_hours) * 0.5 if sleep_hours < 7 else 0
        rpe = rpe_base + rpe_modifier + np.random.normal(0, 0.5)
        rpe = max(1, min(10, round(rpe, 1)))
        
        data.append({
            "date": date,
            "sleep_hours": round(sleep_hours, 1),
            "avg_rpe": rpe,
            "user_id": user_id
        })
    
    return data

def analyze_sleep_rpe_correlation(user_id: str):
    """
    Calculates the correlation coefficient between sleep duration and workout RPE.
    """
    print(f"Analyzing Sleep vs. RPE for user: {user_id}")
    
    # In a real scenario, fetch from Supabase:
    # sleep_data = supabase.table('health_metrics').select('*').eq('user_id', user_id).execute()
    # workout_data = supabase.table('workout_logs').select('*').eq('user_id', user_id).execute()
    
    # Using mock data for now
    data = get_mock_data(user_id)
    df = pd.DataFrame(data)
    
    if df.empty:
        print("No data found.")
        return
    
    correlation = df['sleep_hours'].corr(df['avg_rpe'])
    
    print("\nData Summary:")
    print(df.describe())
    
    print(f"\nCorrelation Coefficient (Sleep vs. RPE): {correlation:.4f}")
    
    if correlation < -0.3:
        print("Insight: Negative correlation detected. Less sleep tends to lead to higher RPE (harder workouts).")
    elif correlation > 0.3:
        print("Insight: Positive correlation detected (Unusual). More sleep associated with higher RPE?")
    else:
        print("Insight: No strong correlation detected yet.")

if __name__ == "__main__":
    # Test with a dummy user
    analyze_sleep_rpe_correlation("user_test_123")
