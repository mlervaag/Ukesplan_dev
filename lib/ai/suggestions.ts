/**
 * AI Suggestions Utility (Placeholder)
 * 
 * Future integration:
 * - Load event log from /api/events
 * - Send context to LLM
 * - Return structured suggestions
 */

export interface EventLogEntry {
    id: string;
    eventType: string;
    payload: any;
    createdAt: string;
}

export interface Suggestion {
    dinnerId: string;
    reason: string;
    confidence: number;
}

export interface SuggestionRequest {
    year: number;
    week: number;
    limit?: number;
}

/**
 * Placeholder for dinner suggestions.
 * Returns empty list for now.
 */
export async function getSuggestions(req: SuggestionRequest): Promise<Suggestion[]> {
    // 1. Fetch event log
    // 2. Analyze patterns
    // 3. Match with dinners
    console.log('AI logic will analysis events for:', req);
    return [];
}
