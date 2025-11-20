//
//  WorkoutActivityAttributes.swift
//  VoiceFit
//
//  Activity Kit attributes for Live Activity workout tracking
//

import ActivityKit
import Foundation

@available(iOS 16.1, *)
struct WorkoutActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Current exercise information
        var currentExercise: String?
        var currentSet: Int
        var totalSets: Int

        // Last set data
        var lastSetWeight: Double?
        var lastSetReps: Int?
        var lastSetRPE: Int?

        // Timing
        var elapsedTime: Int // seconds since workout started

        // Rest timer
        var restTimeRemaining: Int? // seconds remaining in rest period
        var restTimerActive: Bool // whether rest timer is currently running
        var targetRestTime: Int // target rest time in seconds (e.g., 90, 120, 180)
        var restStartedAt: Int? // elapsed time when rest started (for calculating remaining)

        // Status
        var status: String // "active" | "paused" | "resting" | "completed"

        // User preferences
        var showElapsedTimer: Bool // user setting to show/hide elapsed timer
        var showRestTimer: Bool // user setting to show/hide rest timer
    }

    // Static attributes that don't change during the activity
    var workoutName: String
    var workoutId: String
}

