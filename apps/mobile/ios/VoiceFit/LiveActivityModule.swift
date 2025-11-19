import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    
    private var currentActivity: Activity<WorkoutAttributes>?
    
    @objc
    func startActivity(_ workoutName: String, startTime: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            reject("not_enabled", "Live Activities are not enabled", nil)
            return
        }
        
        let attributes = WorkoutAttributes(
            workoutName: workoutName,
            startTime: Date(timeIntervalSince1970: startTime)
        )
        
        let initialContentState = WorkoutAttributes.ContentState(
            durationSeconds: 0,
            currentExercise: "Starting...",
            nextExercise: nil,
            activeCalories: 0,
            heartRate: 0,
            setNumber: nil,
            totalSets: nil
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialContentState, staleDate: nil)
            )
            self.currentActivity = activity
            resolve(activity.id)
        } catch {
            reject("start_failed", "Failed to start activity: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func updateActivity(_ data: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let activity = currentActivity else {
            reject("no_activity", "No active activity found", nil)
            return
        }
        
        let durationSeconds = data["durationSeconds"] as? Int ?? 0
        let currentExercise = data["currentExercise"] as? String
        let nextExercise = data["nextExercise"] as? String
        let activeCalories = data["activeCalories"] as? Int ?? 0
        let heartRate = data["heartRate"] as? Int ?? 0
        let setNumber = data["setNumber"] as? Int
        let totalSets = data["totalSets"] as? Int
        
        let contentState = WorkoutAttributes.ContentState(
            durationSeconds: durationSeconds,
            currentExercise: currentExercise,
            nextExercise: nextExercise,
            activeCalories: activeCalories,
            heartRate: heartRate,
            setNumber: setNumber,
            totalSets: totalSets
        )
        
        Task {
            await activity.update(
                ActivityContent(state: contentState, staleDate: nil)
            )
            resolve(nil)
        }
    }
    
    @objc
    func endActivity(_ data: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let activity = currentActivity else {
            resolve(nil) // Already ended or never started
            return
        }
        
        let durationSeconds = data["durationSeconds"] as? Int ?? 0
        let activeCalories = data["activeCalories"] as? Int ?? 0
        
        let finalContentState = WorkoutAttributes.ContentState(
            durationSeconds: durationSeconds,
            currentExercise: "Workout Complete",
            nextExercise: nil,
            activeCalories: activeCalories,
            heartRate: 0,
            setNumber: nil,
            totalSets: nil
        )
        
        Task {
            await activity.end(
                ActivityContent(state: finalContentState, staleDate: nil),
                dismissalPolicy: .default
            )
            self.currentActivity = nil
            resolve(nil)
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
