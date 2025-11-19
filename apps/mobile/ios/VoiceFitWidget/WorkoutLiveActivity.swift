import ActivityKit
import WidgetKit
import SwiftUI

// WorkoutAttributes is defined in WorkoutAttributes.swift

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            // Lock Screen/Banner UI
            VStack(alignment: .leading) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(context.attributes.workoutName)
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        if let currentExercise = context.state.currentExercise {
                            Text("Current: \(currentExercise)")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        Text(formatDuration(context.state.durationSeconds))
                            .font(.system(size: 24, weight: .bold, design: .monospaced))
                            .foregroundColor(.green)
                        
                        HStack(spacing: 4) {
                            Image(systemName: "flame.fill")
                                .foregroundColor(.orange)
                                .font(.caption)
                            Text("\(context.state.activeCalories) cal")
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                .padding()
            }
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(Color.green)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading) {
                        Text("Heart Rate")
                            .font(.caption)
                            .foregroundColor(.gray)
                        HStack {
                            Text("\(context.state.heartRate)")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.red)
                            Image(systemName: "heart.fill")
                                .foregroundColor(.red)
                        }
                    }
                    .padding(.leading)
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        Text("Active Cal")
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("\(context.state.activeCalories)")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                    }
                    .padding(.trailing)
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    VStack {
                        Text(context.state.currentExercise ?? "Resting")
                            .font(.headline)
                        
                        if let setNum = context.state.setNumber, let total = context.state.totalSets {
                            Text("Set \(setNum) of \(total)")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(.bottom)
                }
                
            } compactLeading: {
                Image(systemName: "figure.run")
                    .foregroundColor(.green)
            } compactTrailing: {
                Text(formatDuration(context.state.durationSeconds))
                    .font(.caption)
                    .fontWeight(.bold)
                    .monospacedDigit()
                    .foregroundColor(.green)
            } minimal: {
                Image(systemName: "figure.run")
                    .foregroundColor(.green)
            }
            .widgetURL(URL(string: "voicefit://workout"))
            .keylineTint(Color.green)
        }
    }
    
    func formatDuration(_ seconds: Int) -> String {
        let h = seconds / 3600
        let m = (seconds % 3600) / 60
        let s = seconds % 60
        
        if h > 0 {
            return String(format: "%d:%02d:%02d", h, m, s)
        } else {
            return String(format: "%02d:%02d", m, s)
        }
    }
}
