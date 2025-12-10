import { ModelRating, SolutionScore } from '@/types/game';
import * as storage from './storage';

const INITIAL_ELO = 1500;
const K_FACTOR = 32;

export function calculateELOChange(
  currentRating: number,
  opponentRating: number,
  won: boolean
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
  const actualScore = won ? 1 : 0;
  return K_FACTOR * (actualScore - expectedScore);
}

export function updateRatings(
  scores: SolutionScore[]
): Map<string, number> {
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  const ratingChanges = new Map<string, number>();

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const winner = sorted[i];
      const loser = sorted[j];
      
      const change = calculateELOChange(winner.totalScore * 100, loser.totalScore * 100, true);
      ratingChanges.set(winner.modelId, (ratingChanges.get(winner.modelId) || 0) + change);
      ratingChanges.set(loser.modelId, (ratingChanges.get(loser.modelId) || 0) - change);
    }
  }

  return ratingChanges;
}

export async function updateModelRating(
  current: ModelRating | undefined,
  score: SolutionScore,
  won: boolean,
  eloChange: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<ModelRating> {
  let currentStreak = 0;
  let bestStreak = 0;
  if (current) {
    currentStreak = won ? (current.currentStreak || 0) + 1 : 0;
    bestStreak = Math.max(current.bestStreak || 0, currentStreak);
  } else {
    currentStreak = won ? 1 : 0;
    bestStreak = currentStreak;
  }

  const humanRatings = await storage.getHumanRatingsForModel(score.modelId);
  const averageHumanRating = humanRatings.length > 0
    ? humanRatings.reduce((sum, r) => sum + r.rating, 0) / humanRatings.length
    : 0;

  const newRating = current
    ? {
        ...current,
        eloRating: Math.max(1000, current.eloRating + eloChange),
        totalRounds: current.totalRounds + 1,
        wins: current.wins + (won ? 1 : 0),
        currentStreak,
        bestStreak,
        averageScore:
          (current.averageScore * current.totalRounds + score.totalScore) /
          (current.totalRounds + 1),
        averageHumanRating,
        bestMetric: {
          feasibility: Math.max(current.bestMetric.feasibility, score.feasibility),
          optimality: Math.max(current.bestMetric.optimality, score.optimality),
          clarity: Math.max(current.bestMetric.clarity, score.clarity),
          llmJudge: Math.max(current.bestMetric.llmJudge || 0, score.llmJudgeScore || 0),
        },
        difficultyStats: {
          easy: {
            wins: current.difficultyStats.easy.wins + (won && difficulty === 'easy' ? 1 : 0),
            rounds: current.difficultyStats.easy.rounds + (difficulty === 'easy' ? 1 : 0),
          },
          medium: {
            wins: current.difficultyStats.medium.wins + (won && difficulty === 'medium' ? 1 : 0),
            rounds: current.difficultyStats.medium.rounds + (difficulty === 'medium' ? 1 : 0),
          },
          hard: {
            wins: current.difficultyStats.hard.wins + (won && difficulty === 'hard' ? 1 : 0),
            rounds: current.difficultyStats.hard.rounds + (difficulty === 'hard' ? 1 : 0),
          },
        },
      }
    : {
        modelId: score.modelId,
        eloRating: INITIAL_ELO + eloChange,
        totalRounds: 1,
        wins: won ? 1 : 0,
        currentStreak,
        bestStreak,
        averageScore: score.totalScore,
        averageHumanRating,
        bestMetric: {
          feasibility: score.feasibility,
          optimality: score.optimality,
          clarity: score.clarity,
          llmJudge: score.llmJudgeScore || 0,
        },
        difficultyStats: {
          easy: { wins: difficulty === 'easy' && won ? 1 : 0, rounds: difficulty === 'easy' ? 1 : 0 },
          medium: { wins: difficulty === 'medium' && won ? 1 : 0, rounds: difficulty === 'medium' ? 1 : 0 },
          hard: { wins: difficulty === 'hard' && won ? 1 : 0, rounds: difficulty === 'hard' ? 1 : 0 },
        },
      };

  return newRating;
}

