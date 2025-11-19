import { NativeModules, Platform } from "react-native";

const { LiveActivityModule } = NativeModules;

export interface LiveActivityState {
    durationSeconds: number;
    currentExercise?: string;
    nextExercise?: string;
    activeCalories: number;
    heartRate: number;
    setNumber?: number;
    totalSets?: number;
}

class LiveActivityService {
    private currentActivityId: string | null = null;

    async startActivity(
        workoutName: string,
        startTime: number = Date.now() / 1000
    ): Promise<string | null> {
        if (Platform.OS !== "ios" || !LiveActivityModule) {
            console.warn("Live Activities are only available on iOS");
            return null;
        }

        try {
            const activityId = await LiveActivityModule.startActivity(
                workoutName,
                startTime
            );
            this.currentActivityId = activityId;
            console.log("Started Live Activity:", activityId);
            return activityId;
        } catch (error) {
            console.error("Failed to start Live Activity:", error);
            return null;
        }
    }

    async updateActivity(state: LiveActivityState): Promise<void> {
        if (Platform.OS !== "ios" || !LiveActivityModule || !this.currentActivityId) {
            return;
        }

        try {
            await LiveActivityModule.updateActivity(state);
        } catch (error) {
            console.error("Failed to update Live Activity:", error);
        }
    }

    async endActivity(finalState: LiveActivityState): Promise<void> {
        if (Platform.OS !== "ios" || !LiveActivityModule || !this.currentActivityId) {
            return;
        }

        try {
            await LiveActivityModule.endActivity(finalState);
            this.currentActivityId = null;
            console.log("Ended Live Activity");
        } catch (error) {
            console.error("Failed to end Live Activity:", error);
        }
    }
}

export const liveActivityService = new LiveActivityService();
