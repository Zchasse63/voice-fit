//
//  LiveActivityModule.swift
//  VoiceFit
//
//  React Native bridge for Activity Kit Live Activities
//

import ActivityKit
import Foundation
import React

@objc(LiveActivityModule)
@available(iOS 16.1, *)
class LiveActivityModule: NSObject {
    private var currentActivity: Activity<WorkoutActivityAttributes>?
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // MARK: - Start Activity
    
    @objc
    func startActivity(
        _ attributes: NSDictionary,
        initialState: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        // Check iOS version
        guard #available(iOS 16.1, *) else {
            rejecter("UNSUPPORTED_VERSION", "Live Activities require iOS 16.1 or later", nil)
            return
        }
        
        // Parse attributes
        guard let workoutName = attributes["workoutName"] as? String,
              let workoutId = attributes["workoutId"] as? String else {
            rejecter("INVALID_PARAMS", "Missing required attributes: workoutName, workoutId", nil)
            return
        }
        
        // Parse initial state
        let state = parseState(initialState)
        
        // Create activity attributes
        let activityAttributes = WorkoutActivityAttributes(
            workoutName: workoutName,
            workoutId: workoutId
        )
        
        do {
            // Request Live Activity
            let activity = try Activity.request(
                attributes: activityAttributes,
                contentState: state,
                pushType: nil
            )
            
            currentActivity = activity
            resolver(activity.id)
            
            print("✅ Live Activity started: \(activity.id)")
        } catch {
            rejecter("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
    }
    
    // MARK: - Update Activity
    
    @objc
    func updateActivity(
        _ activityId: String,
        state: NSDictionary,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            rejecter("UNSUPPORTED_VERSION", "Live Activities require iOS 16.1 or later", nil)
            return
        }
        
        guard let activity = currentActivity else {
            rejecter("NO_ACTIVITY", "No active Live Activity found", nil)
            return
        }
        
        let newState = parseState(state)
        
        Task {
            await activity.update(using: newState)
            resolver(nil)
            print("✅ Live Activity updated")
        }
    }
    
    // MARK: - End Activity
    
    @objc
    func endActivity(
        _ activityId: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.1, *) else {
            rejecter("UNSUPPORTED_VERSION", "Live Activities require iOS 16.1 or later", nil)
            return
        }
        
        guard let activity = currentActivity else {
            rejecter("NO_ACTIVITY", "No active Live Activity found", nil)
            return
        }
        
        Task {
            await activity.end(dismissalPolicy: .immediate)
            currentActivity = nil
            resolver(nil)
            print("✅ Live Activity ended")
        }
    }
    
    // MARK: - Check Support
    
    @objc
    func areActivitiesEnabled(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 16.1, *) {
            resolver(ActivityAuthorizationInfo().areActivitiesEnabled)
        } else {
            resolver(false)
        }
    }
    
    // MARK: - Get Active Activities
    
    @objc
    func getActiveActivityIds(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 16.1, *) {
            let activities = Activity<WorkoutActivityAttributes>.activities
            let ids = activities.map { $0.id }
            resolver(ids)
        } else {
            resolver([])
        }
    }
    
    // MARK: - Helper Methods
    
    @available(iOS 16.1, *)
    private func parseState(_ dict: NSDictionary) -> WorkoutActivityAttributes.ContentState {
        return WorkoutActivityAttributes.ContentState(
            currentExercise: dict["currentExercise"] as? String,
            currentSet: dict["currentSet"] as? Int ?? 0,
            totalSets: dict["totalSets"] as? Int ?? 0,
            lastSetWeight: dict["lastSetWeight"] as? Double,
            lastSetReps: dict["lastSetReps"] as? Int,
            lastSetRPE: dict["lastSetRPE"] as? Int,
            elapsedTime: dict["elapsedTime"] as? Int ?? 0,
            restTimeRemaining: dict["restTimeRemaining"] as? Int,
            restTimerActive: dict["restTimerActive"] as? Bool ?? false,
            targetRestTime: dict["targetRestTime"] as? Int ?? 90,
            restStartedAt: dict["restStartedAt"] as? Int,
            status: dict["status"] as? String ?? "active",
            showElapsedTimer: dict["showElapsedTimer"] as? Bool ?? true,
            showRestTimer: dict["showRestTimer"] as? Bool ?? true
        )
    }
}

