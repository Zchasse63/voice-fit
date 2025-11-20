//
//  SiriShortcutsManager.swift
//  VoiceFit
//
//  Manager for Siri Shortcuts integration
//

import Foundation
import Intents
import React

@objc(SiriShortcutsManager)
class SiriShortcutsManager: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // MARK: - Donate Shortcuts
    
    /**
     * Donate "Log Set" shortcut to Siri
     * User can say: "Hey Siri, log set" or "Hey Siri, log 225 for 8 reps"
     */
    @objc
    func donateLogSetShortcut(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 12.0, *) {
            let activity = NSUserActivity(activityType: "com.voicefit.logset")
            activity.title = "Log Set"
            activity.isEligibleForSearch = true
            activity.isEligibleForPrediction = true
            activity.persistentIdentifier = "com.voicefit.logset"
            
            // Suggested invocation phrase
            let attributes = CSSearchableItemAttributeSet(itemContentType: "com.voicefit.logset")
            attributes.contentDescription = "Log a workout set with voice"
            activity.contentAttributeSet = attributes
            
            // Donate the activity
            activity.becomeCurrent()
            
            resolver(true)
            print("✅ Donated 'Log Set' shortcut to Siri")
        } else {
            rejecter("UNSUPPORTED_VERSION", "Siri Shortcuts require iOS 12.0 or later", nil)
        }
    }
    
    /**
     * Donate "Complete Set" shortcut to Siri
     * User can say: "Hey Siri, complete set"
     */
    @objc
    func donateCompleteSetShortcut(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 12.0, *) {
            let activity = NSUserActivity(activityType: "com.voicefit.completeset")
            activity.title = "Complete Set"
            activity.isEligibleForSearch = true
            activity.isEligibleForPrediction = true
            activity.persistentIdentifier = "com.voicefit.completeset"
            
            let attributes = CSSearchableItemAttributeSet(itemContentType: "com.voicefit.completeset")
            attributes.contentDescription = "Complete the current set as prescribed"
            activity.contentAttributeSet = attributes
            
            activity.becomeCurrent()
            
            resolver(true)
            print("✅ Donated 'Complete Set' shortcut to Siri")
        } else {
            rejecter("UNSUPPORTED_VERSION", "Siri Shortcuts require iOS 12.0 or later", nil)
        }
    }
    
    /**
     * Donate "Skip Rest" shortcut to Siri
     * User can say: "Hey Siri, skip rest"
     */
    @objc
    func donateSkipRestShortcut(
        _ resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 12.0, *) {
            let activity = NSUserActivity(activityType: "com.voicefit.skiprest")
            activity.title = "Skip Rest"
            activity.isEligibleForSearch = true
            activity.isEligibleForPrediction = true
            activity.persistentIdentifier = "com.voicefit.skiprest"
            
            let attributes = CSSearchableItemAttributeSet(itemContentType: "com.voicefit.skiprest")
            attributes.contentDescription = "Skip the rest timer and continue to next set"
            activity.contentAttributeSet = attributes
            
            activity.becomeCurrent()
            
            resolver(true)
            print("✅ Donated 'Skip Rest' shortcut to Siri")
        } else {
            rejecter("UNSUPPORTED_VERSION", "Siri Shortcuts require iOS 12.0 or later", nil)
        }
    }
    
    // MARK: - Handle Shortcuts
    
    /**
     * Handle incoming Siri Shortcut
     * Called when user invokes a shortcut via Siri
     */
    @objc
    func handleShortcut(
        _ activityType: String,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        switch activityType {
        case "com.voicefit.logset":
            // Post notification to app to open voice logging screen
            NotificationCenter.default.post(
                name: NSNotification.Name("OpenVoiceLogging"),
                object: nil
            )
            resolver(["action": "log_set"])
            
        case "com.voicefit.completeset":
            // Post notification to complete current set
            NotificationCenter.default.post(
                name: NSNotification.Name("CompleteSetFromSiri"),
                object: nil
            )
            resolver(["action": "complete_set"])
            
        case "com.voicefit.skiprest":
            // Post notification to skip rest timer
            NotificationCenter.default.post(
                name: NSNotification.Name("SkipRestFromSiri"),
                object: nil
            )
            resolver(["action": "skip_rest"])
            
        default:
            rejecter("UNKNOWN_SHORTCUT", "Unknown shortcut type: \(activityType)", nil)
        }
    }
}

