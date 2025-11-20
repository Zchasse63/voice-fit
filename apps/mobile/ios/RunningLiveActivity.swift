//
//  RunningLiveActivity.swift
//  VoiceFit
//
//  Live Activity widget for running workout tracking
//

import ActivityKit
import WidgetKit
import SwiftUI

@available(iOS 16.1, *)
struct RunningLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RunningActivityAttributes.self) { context in
            // Lock screen view
            RunningLockScreenView(context: context)
        } dynamicIsland: { context in
            // Dynamic Island views
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 4) {
                        Image(systemName: "figure.run")
                            .foregroundColor(.green)
                        Text(context.state.currentPace)
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    Text(formatDistance(context.state.distanceCovered))
                        .font(.caption)
                        .fontWeight(.semibold)
                }

                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.currentLapDescription)
                        .font(.caption2)
                        .lineLimit(1)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text("Avg: \(context.state.averagePace)")
                            .font(.caption2)
                        Spacer()
                        Text(formatTime(context.state.elapsedTime))
                            .font(.caption2)
                            .monospacedDigit()
                    }
                }
            } compactLeading: {
                Image(systemName: "figure.run")
                    .foregroundColor(.green)
            } compactTrailing: {
                Text(context.state.currentPace)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .monospacedDigit()
            } minimal: {
                Image(systemName: "figure.run")
                    .foregroundColor(.green)
            }
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, secs)
        } else {
            return String(format: "%d:%02d", minutes, secs)
        }
    }

    private func formatDistance(_ miles: Double) -> String {
        return String(format: "%.2f mi", miles)
    }
}

// MARK: - Lock Screen View

@available(iOS 16.1, *)
struct RunningLockScreenView: View {
    let context: ActivityViewContext<RunningActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with workout name and elapsed time
            HStack {
                Image(systemName: "figure.run")
                    .foregroundColor(.green)
                    .font(.title3)

                Text(context.attributes.workoutName)
                    .font(.headline)
                    .lineLimit(1)

                Spacer()

                if context.state.showElapsedTimer {
                    Text(formatTime(context.state.elapsedTime))
                        .font(.subheadline)
                        .monospacedDigit()
                        .foregroundColor(.secondary)
                }
            }

            // Real-time metrics
            if context.state.showPaceMetrics {
                HStack(spacing: 20) {
                    MetricView(
                        label: "Pace",
                        value: context.state.currentPace,
                        icon: "speedometer"
                    )

                    MetricView(
                        label: "Distance",
                        value: formatDistance(context.state.distanceCovered),
                        icon: "location.fill"
                    )

                    MetricView(
                        label: "Avg Pace",
                        value: context.state.averagePace,
                        icon: "chart.line.uptrend.xyaxis"
                    )
                }
            }

            // Current lap/interval
            CurrentLapView(
                lapType: context.state.currentLapType,
                description: context.state.currentLapDescription,
                targetPace: context.state.currentLapTargetPace,
                progress: context.state.currentLapProgress,
                distanceCovered: context.state.currentLapDistanceCovered,
                targetDistance: context.state.currentLapTargetDistance
            )

            // Next lap preview
            if let nextLapDescription = context.state.nextLapDescription {
                NextLapView(
                    lapType: context.state.nextLapType ?? "unknown",
                    description: nextLapDescription
                )
            }
        }
        .padding()
    }

    private func formatTime(_ seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, secs)
        } else {
            return String(format: "%d:%02d", minutes, secs)
        }
    }

    private func formatDistance(_ miles: Double) -> String {
        return String(format: "%.2f mi", miles)
    }
}

// MARK: - Metric View

@available(iOS 16.1, *)
struct MetricView: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(value)
                .font(.subheadline)
                .fontWeight(.bold)
                .monospacedDigit()

            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Current Lap View

@available(iOS 16.1, *)
struct CurrentLapView: View {
    let lapType: String
    let description: String
    let targetPace: String?
    let progress: Double
    let distanceCovered: Double
    let targetDistance: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(lapTypeIcon)
                    .font(.title3)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Current Lap")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(description)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }

                Spacer()

                if let targetPace = targetPace {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Target")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Text(targetPace)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .monospacedDigit()
                    }
                }
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(lapTypeColor)
                        .frame(width: geometry.size.width * progress, height: 6)
                        .cornerRadius(3)
                        .animation(.linear(duration: 0.5), value: progress)
                }
            }
            .frame(height: 6)

            // Distance progress
            if let targetDistance = targetDistance {
                HStack {
                    Text(String(format: "%.2f / %.2f mi", distanceCovered, targetDistance))
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text(String(format: "%.0f%%", progress * 100))
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(lapTypeColor)
                }
            }
        }
        .padding()
        .background(lapTypeColor.opacity(0.15))
        .cornerRadius(12)
    }

    private var lapTypeIcon: String {
        switch lapType {
        case "interval":
            return "⚡️"
        case "rest":
            return "🚶"
        case "easy":
            return "🏃"
        case "warmup":
            return "🔥"
        case "cooldown":
            return "❄️"
        default:
            return "🏃"
        }
    }

    private var lapTypeColor: Color {
        switch lapType {
        case "interval":
            return .orange
        case "rest":
            return .blue
        case "easy":
            return .green
        case "warmup":
            return .yellow
        case "cooldown":
            return .cyan
        default:
            return .green
        }
    }
}

// MARK: - Next Lap View

@available(iOS 16.1, *)
struct NextLapView: View {
    let lapType: String
    let description: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "arrow.right.circle.fill")
                .foregroundColor(.secondary)

            VStack(alignment: .leading, spacing: 2) {
                Text("Next")
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Text(description)
                    .font(.caption)
                    .fontWeight(.medium)
            }

            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}

