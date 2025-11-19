import Foundation
import HealthKit

@objc
class HealthKitManager: NSObject {
    static let shared = HealthKitManager()
    let healthStore = HKHealthStore()
    
    private override init() {}
    
    func requestAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false, NSError(domain: "com.voicefit.app", code: 1, userInfo: [NSLocalizedDescriptionKey: "HealthKit not available on this device"]))
            return
        }
        
        let readTypes: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .dietaryEnergyConsumed)!,
            HKObjectType.quantityType(forIdentifier: .dietaryProtein)!,
            HKObjectType.quantityType(forIdentifier: .dietaryCarbohydrates)!,
            HKObjectType.quantityType(forIdentifier: .dietaryFatTotal)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            completion(success, error)
        }
    }
    
    func getNutritionData(for date: Date, completion: @escaping ([String: Double]?, Error?) -> Void) {
        let calendar = Calendar.current
        let startDate = calendar.startOfDay(for: date)
        let endDate = calendar.date(byAdding: .day, value: 1, to: startDate)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        let energyType = HKQuantityType.quantityType(forIdentifier: .dietaryEnergyConsumed)!
        let proteinType = HKQuantityType.quantityType(forIdentifier: .dietaryProtein)!
        let carbsType = HKQuantityType.quantityType(forIdentifier: .dietaryCarbohydrates)!
        let fatType = HKQuantityType.quantityType(forIdentifier: .dietaryFatTotal)!
        
        let types = [energyType, proteinType, carbsType, fatType]
        var results: [String: Double] = [:]
        let group = DispatchGroup()
        
        for type in types {
            group.enter()
            
            let query = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
                defer { group.leave() }
                
                if let sum = result?.sumQuantity() {
                    let unit: HKUnit = (type == energyType) ? .kilocalorie() : .gram()
                    let value = sum.doubleValue(for: unit)
                    
                    switch type {
                    case energyType: results["calories"] = value
                    case proteinType: results["protein"] = value
                    case carbsType: results["carbs"] = value
                    case fatType: results["fat"] = value
                    default: break
                    }
                }
            }
            
            healthStore.execute(query)
        }
        
        group.notify(queue: .main) {
            completion(results, nil)
        }
    }
}
