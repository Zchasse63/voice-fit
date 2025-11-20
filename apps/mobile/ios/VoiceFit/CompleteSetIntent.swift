//
//  CompleteSetIntent.swift
//  VoiceFit
//
//  App Intent for completing a set as prescribed from Live Activity
//

import AppIntents
import Foundation

@available(iOS 16.4, *)
struct CompleteSetIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Set"
    static var description = IntentDescription("Complete the current set as prescribed")
    
    // No parameters needed - uses current workout state
    
    func perform() async throws -> some IntentResult {
        // Get the active workout from WorkoutManager
        // This will be called when user taps "Complete Set" button in Live Activity
        
        // In a real implementation, this would:
        // 1. Get current workout state from WorkoutManager singleton
        // 2. Log the current set with prescribed weight/reps
        // 3. Update Live Activity to show next set
        // 4. Start rest timer if configured
        
        print("✅ CompleteSetIntent executed - logging set as prescribed")
        
        // Post notification to app to handle the action
        NotificationCenter.default.post(
            name: NSNotification.Name("CompleteSetFromLiveActivity"),
            object: nil
        )
        
        return .result()
    }
}

