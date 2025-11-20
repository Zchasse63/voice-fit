//
//  SkipRestIntent.swift
//  VoiceFit
//
//  App Intent for skipping rest timer from Live Activity
//

import AppIntents
import Foundation

@available(iOS 16.4, *)
struct SkipRestIntent: AppIntent {
    static var title: LocalizedStringResource = "Skip Rest"
    static var description = IntentDescription("Skip the rest timer and continue to next set")
    
    // No parameters needed - uses current workout state
    
    func perform() async throws -> some IntentResult {
        // Skip the rest timer and prepare for next set
        
        // In a real implementation, this would:
        // 1. Stop the rest timer
        // 2. Update Live Activity to remove rest timer display
        // 3. Prepare for next set
        
        print("✅ SkipRestIntent executed - skipping rest timer")
        
        // Post notification to app to handle the action
        NotificationCenter.default.post(
            name: NSNotification.Name("SkipRestFromLiveActivity"),
            object: nil
        )
        
        return .result()
    }
}

