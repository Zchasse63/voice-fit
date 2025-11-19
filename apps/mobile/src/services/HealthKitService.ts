import { NativeModules, Platform } from 'react-native';

const { HealthKitModule } = NativeModules;

export interface NutritionData {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

class HealthKitService {
    async requestAuthorization(): Promise<boolean> {
        if (Platform.OS !== 'ios') {
            return false;
        }
        try {
            const result = await HealthKitModule.requestAuthorization();
            return result;
        } catch (error) {
            console.error('HealthKit Authorization Error:', error);
            return false;
        }
    }

    async getNutritionData(date: Date): Promise<NutritionData> {
        if (Platform.OS !== 'ios') {
            return {};
        }
        try {
            const data = await HealthKitModule.getNutritionData(date.toISOString());
            return data;
        } catch (error) {
            console.error('HealthKit Fetch Error:', error);
            return {};
        }
    }
}

export default new HealthKitService();
