import { ModelId, ModelComparison, ComparisonMetrics, PerformanceInsights, MatchRecord, RoundResult, Difficulty, PuzzleType } from '@/types/game';
import { getRecentRounds } from './storage';

// This is a simplified analytics engine. A real implementation would be more complex.

async function getHistoricalData(modelIds: ModelId[]): Promise<RoundResult[]> {
  // In a real system, you'd fetch relevant historical data more efficiently.
  // For now, we'll fetch recent rounds and filter.
  const allRounds = await getRecentRounds(500);
  return allRounds.filter(round => 
    round.scores.some(score => modelIds.includes(score.modelId))
  );
}

function calculateMetrics(modelId: ModelId, rounds: RoundResult[]): ComparisonMetrics {
  const modelRounds = rounds.filter(r => r.scores.some(s => s.modelId === modelId));
  if (modelRounds.length === 0) {
    return { winRate: 0, avgScore: 0, consistency: 0, performanceByDifficulty: { easy: { wins: 0, rounds: 0 }, medium: { wins: 0, rounds: 0 }, hard: { wins: 0, rounds: 0 } } };
  }

  const wins = modelRounds.filter(r => r.winner === modelId).length;
  const winRate = wins / modelRounds.length;

  const scores = modelRounds.map(r => r.scores.find(s => s.modelId === modelId)!.totalScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  const mean = avgScore;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const consistency = 1 - stdDev; // Simplified consistency metric

  const performanceByDifficulty = modelRounds.reduce((acc, round) => {
    const difficulty = round.puzzle.difficulty;
    acc[difficulty].rounds += 1;
    if (round.winner === modelId) {
      acc[difficulty].wins += 1;
    }
    return acc;
  }, { easy: { wins: 0, rounds: 0 }, medium: { wins: 0, rounds: 0 }, hard: { wins: 0, rounds: 0 } } as Record<Difficulty, { wins: number; rounds: number }>);

  return { winRate, avgScore, consistency, performanceByDifficulty };
}

function generateInsights(metrics: ComparisonMetrics): PerformanceInsights {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const bestPerformerFor: Difficulty[] = [];

  // Analyze Win Rate
  if (metrics.winRate > 0.7) {
    strengths.push('High Win Rate');
  } else if (metrics.winRate < 0.3) {
    weaknesses.push('Low Win Rate');
  }

  // Analyze Consistency
  if (metrics.consistency > 0.9) {
    strengths.push('Very Consistent');
  } else if (metrics.consistency < 0.7) {
    weaknesses.push('Inconsistent Performance');
  }

  // Analyze Difficulty Performance
  if (metrics.performanceByDifficulty.hard.wins / (metrics.performanceByDifficulty.hard.rounds || 1) > 0.6) {
    bestPerformerFor.push('hard');
    strengths.push('Excels at Hard Puzzles');
  }
  if (metrics.performanceByDifficulty.easy.wins / (metrics.performanceByDifficulty.easy.rounds || 1) > 0.8) {
    bestPerformerFor.push('easy');
    strengths.push('Reliable for Easy Tasks');
  }

  // Avg Score Analysis
  if (metrics.avgScore > 0.85) {
    strengths.push('High Quality Solutions');
  } else if (metrics.avgScore < 0.6) {
    weaknesses.push('Suboptimal Solutions');
  }

  // Default fallback
  if (strengths.length === 0) strengths.push('Balanced Profile');
  if (weaknesses.length === 0) weaknesses.push('No Major Weaknesses');

  // Generate Summary
  let summary = '';
  if (metrics.winRate > 0.6 && metrics.consistency > 0.8) {
    summary = 'A top-tier performer with reliable results across various difficulties. Recommended for production use.';
  } else if (metrics.winRate > 0.5) {
    summary = 'A solid contender that performs well but may occasionally struggle with complex edge cases.';
  } else if (metrics.consistency > 0.85) {
    summary = 'Highly consistent but often produces suboptimal solutions compared to top models.';
  } else {
    summary = 'Currently underperforming. May require more prompt engineering or is better suited for simpler tasks.';
  }

  return {
    strengths,
    weaknesses,
    bestPerformerFor,
    recommendedUseCases: ['General Purpose'],
    summary,
  };
}

function calculateHeadToHead(modelA: ModelId, modelB: ModelId, rounds: RoundResult[]): MatchRecord {
  const matches = rounds.filter(r => 
    r.scores.some(s => s.modelId === modelA) && r.scores.some(s => s.modelId === modelB)
  );

  const record: MatchRecord = { wins: 0, losses: 0, draws: 0 };
  for (const match of matches) {
    if (match.winner === modelA) {
      record.wins++;
    } else if (match.winner === modelB) {
      record.losses++;
    } else {
      // This simplistic model doesn't handle draws, but we include it for completeness
    }
  }
  return record;
}

export async function generateModelComparison(modelIds: ModelId[]): Promise<ModelComparison> {
  const historicalData = await getHistoricalData(modelIds);

  const metrics: Partial<Record<ModelId, ComparisonMetrics>> = {};
  const insights: Partial<Record<ModelId, PerformanceInsights>> = {};

  for (const modelId of modelIds) {
    const modelMetrics = calculateMetrics(modelId, historicalData);
    metrics[modelId] = modelMetrics;
    insights[modelId] = generateInsights(modelMetrics);
  }

  const headToHead: Record<string, MatchRecord> = {};
  for (let i = 0; i < modelIds.length; i++) {
    for (let j = i + 1; j < modelIds.length; j++) {
      const modelA = modelIds[i];
      const modelB = modelIds[j];
      const key = `${modelA}_vs_${modelB}`;
      headToHead[key] = calculateHeadToHead(modelA, modelB, historicalData);
    }
  }

  return {
    models: modelIds,
    metrics: metrics as Record<ModelId, ComparisonMetrics>,
    insights: insights as Record<ModelId, PerformanceInsights>,
    headToHead,
  };
}
