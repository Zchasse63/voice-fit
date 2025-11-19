import { apiClient } from './api/config';

export interface WarmupGenerateRequest {
    workout_type: string;
    duration_minutes?: number;
    equipment?: string[];
}

export interface WarmupGenerateResponse {
    warmup: {
        name: string;
        exercises: Array<{
            name: string;
            duration?: string;
            reps?: number;
            notes?: string;
        }>;
        duration_minutes: number;
    };
    message: string;
}

export class WarmupService {
    private static instance: WarmupService;

    private constructor() { }

    static getInstance(): WarmupService {
        if (!WarmupService.instance) {
            WarmupService.instance = new WarmupService();
        }
        return WarmupService.instance;
    }

    /**
     * Generate a warmup routine based on workout type.
     */
    async generateWarmup(
        request: WarmupGenerateRequest
    ): Promise<WarmupGenerateResponse> {
        try {
            const response = await apiClient.post<WarmupGenerateResponse>(
                '/api/warmup/generate',
                request
            );
            return response;
        } catch (error) {
            console.error('Error generating warmup:', error);
            throw error;
        }
    }
}

export const warmupService = WarmupService.getInstance();
