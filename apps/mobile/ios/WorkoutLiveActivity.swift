//
//  WorkoutLiveActivity.swift
//  VoiceFit
//
//  Live Activity widget for workout tracking on lock screen and Dynamic Island
//

import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

@available(iOS 16.1, *)
struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { context in
            // Lock Screen UI
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
                // Expanded view (when user long-presses)
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.state.currentExercise ?? "Workout")
                            .font(.headline)
                            .lineLimit(1)
                        Text(context.attributes.workoutName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("\(context.state.currentSet)/\(context.state.totalSets)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Sets")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        // Elapsed time
                        HStack(spacing: 4) {
                            Image(systemName: "clock.fill")
                                .font(.caption)
                            Text(formatTime(context.state.elapsedTime))
                                .font(.subheadline)
                                .monospacedDigit()
                        }
                        
                        Spacer()
                        
                        // Last set info
                        if let weight = context.state.lastSetWeight,
                           let reps = context.state.lastSetReps {
                            HStack(spacing: 4) {
                                Text("\(Int(weight))lbs")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                Text("×")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("\(reps)")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                
                                if let rpe = context.state.lastSetRPE {
                                    Text("RPE \(rpe)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                }
            } compactLeading: {
                // Compact leading (left side of notch)
                Image(systemName: "figure.strengthtraining.traditional")
                    .foregroundColor(.green)
            } compactTrailing: {
                // Compact trailing (right side of notch)
                Text("\(context.state.currentSet)/\(context.state.totalSets)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.green)
            } minimal: {
                // Minimal view (when multiple activities are running)
                Image(systemName: "figure.strengthtraining.traditional")
                    .foregroundColor(.green)
            }
        }
    }
}

@available(iOS 16.1, *)
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<WorkoutActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with workout name and elapsed time
            HStack {
                Image(systemName: "figure.strengthtraining.traditional")
                    .foregroundColor(.green)
                    .font(.title3)

                Text(context.attributes.workoutName)
                    .font(.headline)
                    .lineLimit(1)

                Spacer()

                // Elapsed time (if enabled in settings)
                if context.state.showElapsedTimer {
                    Text(formatTime(context.state.elapsedTime))
                        .font(.subheadline)
                        .monospacedDigit()
                        .foregroundColor(.secondary)
                }
            }

            // Current exercise
            if let exercise = context.state.currentExercise {
                Text(exercise)
                    .font(.title2)
                    .fontWeight(.bold)
                    .lineLimit(2)
            } else {
                Text("Ready to start")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }

            // REST TIMER (if active and enabled in settings)
            if context.state.restTimerActive,
               context.state.showRestTimer,
               let restTime = context.state.restTimeRemaining {
                RestTimerView(
                    restTimeRemaining: restTime,
                    targetRestTime: context.state.targetRestTime
                )
            }

            // Progress and last set info
            HStack {
                // Set progress
                Text("Set \(context.state.currentSet) of \(context.state.totalSets)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                // Last set data
                if let weight = context.state.lastSetWeight,
                   let reps = context.state.lastSetReps {
                    HStack(spacing: 4) {
                        Text("\(Int(weight))lbs × \(reps)")
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        if let rpe = context.state.lastSetRPE {
                            Text("• RPE \(rpe)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            // ACTION BUTTONS (iOS 17.0+)
            if #available(iOS 17.0, *) {
                ActionButtonsView(
                    isResting: context.state.restTimerActive
                )
            }
        }
        .padding()
    }
}

// MARK: - Rest Timer View

@available(iOS 16.1, *)
struct RestTimerView: View {
    let restTimeRemaining: Int
    let targetRestTime: Int

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "timer")
                .font(.title3)
                .foregroundColor(restColor)

            VStack(alignment: .leading, spacing: 2) {
                Text("Rest")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(formatTime(restTimeRemaining))
                    .font(.title2)
                    .fontWeight(.bold)
                    .monospacedDigit()
                    .foregroundColor(restColor)
            }

            Spacer()

            // Progress indicator
            CircularProgressView(
                progress: Double(targetRestTime - restTimeRemaining) / Double(targetRestTime),
                color: restColor
            )
            .frame(width: 40, height: 40)
        }
        .padding()
        .background(restColor.opacity(0.15))
        .cornerRadius(12)
    }

    private var restColor: Color {
        if restTimeRemaining <= 10 {
            return .red
        } else if restTimeRemaining <= 30 {
            return .orange
        } else {
            return .blue
        }
    }
}

// MARK: - Circular Progress View

@available(iOS 16.1, *)
struct CircularProgressView: View {
    let progress: Double
    let color: Color

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.3), lineWidth: 4)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: progress)
        }
    }
}

// MARK: - Action Buttons View

@available(iOS 17.0, *)
struct ActionButtonsView: View {
    let isResting: Bool

    var body: some View {
        HStack(spacing: 12) {
            if isResting {
                // Skip Rest button (during rest)
                Button(intent: SkipRestIntent()) {
                    Label("Skip Rest", systemImage: "forward.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            } else {
                // Complete Set button (during active set)
                Button(intent: CompleteSetIntent()) {
                    Label("✓ Complete", systemImage: "checkmark.circle.fill")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
            }

            // Adjust Set button (deep link to app)
            Link(destination: URL(string: "voicefit://voice-log")!) {
                Label("🎤 Adjust", systemImage: "mic.fill")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .buttonStyle(.bordered)
            .tint(.blue)
        }
    }
}

// Helper function to format elapsed time
func formatTime(_ seconds: Int) -> String {
    let minutes = seconds / 60
    let secs = seconds % 60
    return String(format: "%d:%02d", minutes, secs)
}

