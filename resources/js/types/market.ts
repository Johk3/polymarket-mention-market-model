export interface MarketToken {
    token_id: string;
    outcome: string; // "Yes" | "No"
    price: number; // 0–1
    winner: boolean;
}

export interface Market {
    condition_id: string;
    question: string;
    description: string;
    end_date_iso: string;
    active: boolean;
    closed: boolean;
    tokens: MarketToken[];
    volume: number;
    liquidity: number;
    target_phrase: string | null;
    model_probability?: number;
}

export interface PricePoint {
    t: number; // unix timestamp
    p: number; // price 0–1
}

export interface ProbabilityEstimate {
    phrase: string;
    probability: number;
    lower_bound: number;
    upper_bound: number;
    base_rate: number;
    statistical_probability: number;
    llm_probability: number | null;
    llm_available: boolean;
    reasoning: string | null;
}

export interface LiveStatus {
    is_live: boolean;
    title?: string;
    url?: string;
    utterance_count?: number;
    recent_utterances?: Array<{ text: string; start_seconds: number }>;
}
