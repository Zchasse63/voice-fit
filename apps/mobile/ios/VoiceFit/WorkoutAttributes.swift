import ActivityKit
import Foundation

struct WorkoutAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic state updated during workout
        var durationSeconds: Int
        var currentExercise: String?
        var nextExercise: String?
        var activeCalories: Int
        var heartRate: Int
        var setNumber: Int?
        var totalSets: Int?
    }

    // Fixed attributes
    var workoutName: String
    var startTime: Date
}
