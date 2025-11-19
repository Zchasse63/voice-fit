import { apiClient } from './api/config';

export interface CoachResponse {
    answer: string;
    sources?: Array<{
        title: string;
        url: string;
        snippet: string;
    }>;
    suggested_actions?: string[];
}

export class CoachService {
    private static instance: CoachService;

    private constructor() { }

    static getInstance(): CoachService {
        if (!CoachService.instance) {
            CoachService.instance = new CoachService();
        }
        return CoachService.instance;
    }

    /**
     * Ask the AI Coach a question
     * @param question User's question
     * @param context Optional context (e.g., current workout)
     */
    async ask(question: string, context?: any): Promise<CoachResponse> {
        try {
            const response = await apiClient.post('/api/coach/ask', {
                question,
                context,
            });
            return response;
        } catch (error) {
            console.error('Error asking AI Coach:', error);
            throw error;
        }
    }

    /**
     * Stream the AI Coach response (if backend supports it)
     * For now, falls back to standard request
     */
    async askStream(question: string, onChunk: (chunk: string) => void): Promise<void> {
        // TODO: Implement true streaming when backend/client supports it
        const response = await this.ask(question);
        onChunk(response.answer);
    }
}

export const coachService = CoachService.getInstance();
