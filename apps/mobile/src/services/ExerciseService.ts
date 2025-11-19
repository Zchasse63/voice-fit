import { apiClient } from './api/config';

export interface ExerciseCreateOrMatchRequest {
    exercise_name: string;
    auto_create?: boolean;
    use_llm_synonyms?: boolean;
    fuzzy_threshold?: number;
}

export interface ExerciseCreateOrMatchResponse {
    success: boolean;
    exercise_id?: string;
    exercise_name: string;
    matched_name?: string;
    match_type?: string;
    match_score?: number;
    synonyms?: string[];
    created: boolean;
    message: string;
    metadata?: any;
}

export class ExerciseService {
    private static instance: ExerciseService;

    private constructor() { }

    static getInstance(): ExerciseService {
        if (!ExerciseService.instance) {
            ExerciseService.instance = new ExerciseService();
        }
        return ExerciseService.instance;
    }

    /**
     * Match or create an exercise based on the name.
     * Uses the backend's smart matching logic.
     */
    async matchOrCreate(
        request: ExerciseCreateOrMatchRequest
    ): Promise<ExerciseCreateOrMatchResponse> {
        try {
            const response = await apiClient.post<ExerciseCreateOrMatchResponse>(
                '/api/exercises/create-or-match',
                request
            );
            return response;
        } catch (error) {
            console.error('Error matching/creating exercise:', error);
            throw error;
        }
    }
}

export const exerciseService = ExerciseService.getInstance();
