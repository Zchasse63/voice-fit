import { apiClient } from './api/config';

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
}

export const nutritionService = NutritionService.getInstance();
