// Mirrors the Pydantic response models. (Optional upgrade: generate these from /openapi.json
// with `npx openapi-typescript http://localhost:8010/openapi.json -o src/api/schema.d.ts`.)

export type GameCreated = { game_id: string; analysis_job_id: number };

export type GameSummary = {
    id: string;
    source: string;
    player_color: "white" | "black";
    white_name: string;
    black_name: string;
    result: string;
    ply_count: number;
    played_at: string | null;
    created_at: string;
    analysis_state: string | null;
};

export type Evidence = {
    id: string;
    ply: number;
    concept: string;
    fen_before: string;
    actual_san: string;
    actual_uci: string;
    candidate_san: string;
    candidate_uci: string;
    targets: { square: string; piece: string }[];
    line_uci: string[];
    line_san: string[];
    cp_actual: number;
    cp_candidate: number;
    mate_candidate: number | null;
    material_gain: number;
    explanation: string;
};

export type Review = {
    game_id: string;
    pgn: string;
    initial_fen: string;
    player_color: "white" | "black";
    analysis_state: "not_started" | "running" | "succeeded" | "partial" | "failed";
    pipeline_version: string;
    engine: string | null;
    limits: Record<string, unknown>;
    positions_total: number;
    positions_analyzed: number;
    findings: Evidence[];
    is_demo: boolean;
};

export type Job = {
    id: number;
    kind: string;
    status: "queued" | "running" | "retry_wait" | "succeeded" | "failed" | "cancelled";
    attempts: number;
    progress: Record<string, number>;
    error_code: string | null;
};

export type ImportRun = {
    id: string;
    provider: string;
    username: string | null;
    state: "queued" | "running" | "succeeded" | "failed" | "cancelled";
    target_limit: number;
    fetched: number;
    eligible: number;
    excluded: number;
    analyzed: number;
    error_code: string | null;
    job_id: number | null;
};

export type PracticeSession = {
    session_id: string;
    fen: string;
    solver_color: "white" | "black";
    concept: string | null;
    mode: "practice" | "assessment";
    state: "active" | "solved" | "failed";
    puzzle_rating: number;
    predicted_p: number;
    last_move_uci: string;
};

export type MoveResult = {
    outcome: "correct" | "incorrect" | "solved";
    fen: string;
    opponent_reply_uci: string | null;
    state: string;
    first_try_success: boolean | null;
    rating_after: number | null;
};

export type PracticeStats = {
    attempts: number;
    first_try_unassisted: number;
    rate: number | null;
    small_sample: boolean;
    mean_puzzle_rating: number | null;
};

export type Progress = {
    concepts: {
        concept: string;
        rating: number | null;
        rating_attempts: number;
        provisional: boolean;
        practice: PracticeStats;
        assessment: PracticeStats;
        games_analyzed: number;
        missed_in_games: number;
        missed_per_10_games: number | null;
    }[];
    note: string;
};