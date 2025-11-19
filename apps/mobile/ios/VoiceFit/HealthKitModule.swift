import Foundation
import React

@objc(HealthKitModule)
class HealthKitModule: NSObject {
    
    @objc
    func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        HealthKitManager.shared.requestAuthorization { success, error in
            if let error = error {
                reject("AUTH_ERROR", error.localizedDescription, error)
            } else {
                resolve(success)
            }
        }
    }
    
    @objc
    func getNutritionData(_ dateIsoString: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let formatter = ISO8601DateFormatter()
        // Support JS ISO string which might include milliseconds
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var date = formatter.date(from: dateIsoString)
        
        if date == nil {
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            date = formatter.date(from: dateIsoString)
        }
        
        guard let validDate = date else {
            reject("INVALID_DATE", "Invalid date format", nil)
            return
        }
        
        HealthKitManager.shared.getNutritionData(for: validDate) { data, error in
            if let error = error {
                reject("FETCH_ERROR", error.localizedDescription, error)
            } else {
                resolve(data ?? [:])
            }
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
