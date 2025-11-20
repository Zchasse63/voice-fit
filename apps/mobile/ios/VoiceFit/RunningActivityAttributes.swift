//
//  RunningActivityAttributes.swift
//  VoiceFit
//
//  Activity Kit attributes for running workout Live Activity
//

import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct RunningActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Real-time metrics
        var currentPace: String // e.g., "6:30 /mi" or "0:00 /mi" if not moving
        var averagePace: String // e.g., "7:15 /mi"
        var distanceCovered: Double // in miles (e.g., 2.34)
        var elapsedTime: Int // seconds since workout started
        
        // Current lap/interval information
        var currentLapType: String // "interval" | "rest" | "easy" | "warmup" | "cooldown"
        var currentLapDescription: String // e.g., "Quarter Mile @ 6:30 pace"
        var currentLapTargetPace: String? // e.g., "6:30 /mi" (nil for rest/easy)
        var currentLapTargetDistance: Double? // in miles (e.g., 0.25 for quarter mile)
        var currentLapProgress: Double // 0.0 to 1.0 (percentage complete)
        var currentLapDistanceCovered: Double // distance covered in current lap
        
        // Next lap preview
        var nextLapType: String? // "interval" | "rest" | "easy" | "cooldown" | nil if last lap
        var nextLapDescription: String? // e.g., "Rest - 1 min walk"
        
        // Workout overview
        var totalPlannedDistance: Double? // total workout distance in miles (nil for time-based)
        var totalPlannedTime: Int? // total workout time in seconds (nil for distance-based)
        
        // Status
        var status: String // "active" | "paused" | "completed"
        
        // User preferences
        var showElapsedTimer: Bool
        var showPaceMetrics: Bool
    }
    
    // Static attributes that don't change during the activity
    var workoutName: String // e.g., "5 Mile Interval Run" or "8 Mile Easy Run"
    var workoutId: String
    var workoutType: String // "interval" | "easy" | "tempo" | "long"
}

