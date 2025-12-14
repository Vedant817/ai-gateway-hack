/* eslint-disable @typescript-eslint/no-explicit-any */
export type PuzzleType = 'meeting-scheduler' | 'study-timetable' | 'delivery-routes';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ModelId =
  | 'grok-code-fast-1'
  | 'grok-4-fast-reasoning'
  | 'claude-sonnet-4.5'
  | 'claude-haiku-4.5'
  | 'claude-opus-4.5'
  | 'claude-3.7-sonnet'
  | 'gpt-4.1-mini'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-3-pro-preview';

export interface PuzzlePersona {
  id: string;
  name: string;
  role: string;
  scenario: string;
  useCase: string;
  icon: string;
}

export interface ChallengeSeed {
  seed: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  customConfig?: any;
}



export interface Participant {
  id: string;
  name: string;
  availableSlots: TimeSlot[];
  requiredMeetings: string[];
  optionalMeetings: string[];
}

export interface TimeSlot {
  start: string; // ISO datetime string
  end: string; // ISO datetime string
}

export interface Meeting {
  id: string;
  name: string;
  duration: number; // minutes
  requiredParticipants: string[]; // participant IDs
  optionalParticipants: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface PuzzleInstance {
  id: string;
  type: PuzzleType;
  difficulty: Difficulty;
  participants: Participant[];
  meetings: Meeting[];
  constraints: {
    maxConcurrentMeetings: number;
    minBreakBetweenMeetings: number; // minutes
    maxDailyMeetingsPerPerson: number;
    workHours: { start: string; end: string }; // daily work hours
  };
  objective: string;
  createdAt: string;
  persona?: PuzzlePersona;
  seed?: string; // Challenge seed for sharing
}

export interface ScheduledMeeting {
  meetingId: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  participants: string[]; // participant IDs
}

export interface ModelSolution {
  modelId: ModelId;
  rawResponse: string;
  scheduledMeetings: ScheduledMeeting[];
  explanation?: string;
  parseError?: string;
}

export interface ConstraintViolation {
  type: 'overlap' | 'double-booking' | 'missing-participant' | 'outside-hours' | 'too-many-daily' | 'insufficient-break' | 'missing-meeting';
  severity: 'critical' | 'warning';
  description: string;
  affectedMeetings?: string[];
  affectedParticipants?: string[];
}

export interface SolutionScore {
  modelId: ModelId;
  feasibility: number; // 0-1, proportion of hard constraints satisfied
  optimality: number; // 0-1, how close to optimal
  clarity: number; // 0-1, output quality and structure
  llmJudgeScore?: number; // 0-1, LLM-as-judge evaluation
  humanRating?: number; // 1-5, human feedback
  violations: ConstraintViolation[];
  totalScore: number; // weighted combination
  responseTime?: number; // milliseconds
}

export interface HumanRating {
  roundId: string;
  userId: string;
  modelId: ModelId;
  rating: number; // 1-5
  feedback?: string;
  timestamp: string;
}

export interface RoundResult {
  roundId: string;
  puzzle: PuzzleInstance;
  solutions: ModelSolution[];
  scores: SolutionScore[];
  winner: ModelId;
  timestamp: string;
}

export interface ModelRating {
  modelId: ModelId;
  eloRating: number;
  totalRounds: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
  averageHumanRating: number;
  bestMetric: {
    feasibility: number;
    optimality: number;
    clarity: number;
    llmJudge: number;
  };
  difficultyStats: {
    easy: { wins: number; rounds: number };
    medium: { wins: number; rounds: number };
    hard: { wins: number; rounds: number };
  };
}

export interface Leaderboard {
  overall: ModelRating[];
  byMetric: {
    feasibility: ModelRating[];
    optimality: ModelRating[];
    clarity: ModelRating[];
    llmJudge: ModelRating[];
    humanRating: ModelRating[];
  };
}

export interface EvalMetrics {
  roundId: string;
  timestamp: string;
  puzzleType: PuzzleType;
  difficulty: Difficulty;
  metrics: {
    feasibility: Record<ModelId, number>;
    optimality: Record<ModelId, number>;
    clarity: Record<ModelId, number>;
    llmJudge: Record<ModelId, number>;
    humanRating: Record<ModelId, number>;
  };
}

export interface PuzzleSchema {
  type: PuzzleType;
  name: string;
  description: string;
  persona: PuzzlePersona;
  generator: (difficulty: Difficulty, seed?: string) => PuzzleInstance;
  validator: (puzzle: PuzzleInstance, solution: ModelSolution) => SolutionScore;
  exporter: (puzzle: PuzzleInstance, solution: ModelSolution) => {
    json: any;
    csv: string;
    calendar: string;
  };
}

// Phase 2.0 Types

// Tournament System
export interface TournamentSettings {
  bestOf: number;
  puzzleType: PuzzleType | 'any';
  difficulty: Difficulty | 'any';
}

export interface Match {
  matchId: string;
  modelA: ModelId;
  modelB: ModelId | null; // null for a bye
  winner?: ModelId;
  results: RoundResult[]; // for best-of-N series
  status: 'pending' | 'in-progress' | 'completed';
}

export interface TournamentRound {
  roundIndex: number;
  matches: Match[];
}

export interface Tournament {
  id: string;
  name: string;
  models: ModelId[];
  rounds: TournamentRound[];
  currentRound: number;
  status: 'pending' | 'active' | 'completed';
  winner?: ModelId;
  settings: TournamentSettings;
  createdAt: string;
}

// Community Challenge System
export interface ChallengeSubmission {
  userId: string; // or some identifier
  solution: ModelSolution;
  score: SolutionScore;
  submittedAt: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  puzzle: PuzzleInstance;
  submissions: ChallengeSubmission[];
  votes: number;
  createdBy: string; // userId
  shareCode: string;
  category: 'community' | 'daily' | 'expert';
  createdAt: string;
}

// Analytics & Insights
export interface ComparisonMetrics {
  winRate: number;
  avgScore: number;
  consistency: number; // std dev of scores
  performanceByDifficulty: Record<Difficulty, { wins: number; rounds: number }>;
}

export interface PerformanceInsights {
  strengths: string[];
  weaknesses: string[];
  bestPerformerFor: Difficulty[];
  recommendedUseCases: string[];
  summary: string;
}

export interface MatchRecord {
  wins: number;
  losses: number;
  draws: number;
}

export interface ModelComparison {
  models: ModelId[];
  metrics: Record<ModelId, ComparisonMetrics>;
  insights: Record<ModelId, PerformanceInsights>;
  headToHead: Record<string, MatchRecord>; // e.g., "modelA_vs_modelB"
}

