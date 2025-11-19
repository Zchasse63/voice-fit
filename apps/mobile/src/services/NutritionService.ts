import { apiClient } from './api/config';
import HealthKitService from './HealthKitService';

export interface NutritionItem {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface NutritionLogRequest {
    user_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    items: NutritionItem[];
    log_date?: string;
}

export interface NutritionLogResponse {
    success: boolean;
    log_id: string;
    summary: {
        total_calories: number;
        protein_g: number;
        carbs_g: number;
        fats_g: number;
    };
    message: string;
}

export class NutritionService {
    private static instance: NutritionService;

    private constructor() { }

    static getInstance(): NutritionService {
        if (!NutritionService.instance) {
            NutritionService.instance = new NutritionService();
        }
        return NutritionService.instance;
    }

    /**
     * Log a nutrition entry.
     */
    async logNutrition(
        request: NutritionLogRequest
    ): Promise<NutritionLogResponse> {
        try {
            const response = await apiClient.post<NutritionLogResponse>(
                '/api/nutrition/log',
                request
            );
            return response;
        } catch (error) {
            console.error('Error logging nutrition:', error);
            throw error;
        }
    }

    /**
     * Get nutrition summary for a specific date.
     */
    async getDailySummary(userId: string, date: string): Promise<any> {
        try {
            const response = await apiClient.get(
                `/api/nutrition/summary?user_id=${userId}&date=${date}`
            );
            return response;
        } catch (error) {
            console.error('Error getting nutrition summary:', error);
            throw error;
        }
    }
    /**
     * Sync nutrition data from Apple Health.
     */
    async syncWithAppleHealth(userId: string): Promise<boolean> {
        try {
            const authorized = await HealthKitService.requestAuthorization();
            if (!authorized) {
                console.warn('HealthKit authorization denied');
                return false;
            }

            const data = await HealthKitService.getNutritionData(new Date());

            if (!data || Object.keys(data).length === 0) {
                console.log('No nutrition data found in HealthKit for today');
                return true;
            }

            // Send to backend
            await apiClient.post('/api/nutrition/sync', {
                user_id: userId,
                date: new Date().toISOString().split('T')[0],
                summary: data
            });

            return true;
        } catch (error) {
            console.error('Error syncing with Apple Health:', error);
            return false;
        }
    }
}

export const nutritionService = NutritionService.getInstance();
