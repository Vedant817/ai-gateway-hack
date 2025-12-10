import { ModelRating, RoundResult, HumanRating, EvalMetrics } from '@/types/game';
import { kvSet, kvGet, kvGetAll, kvDelete } from './kv-client';

const RATINGS_KEY = 'ratings:';
const ROUNDS_KEY = 'rounds:';
const HUMAN_RATINGS_KEY = 'human-ratings:';
const EVAL_METRICS_KEY = 'eval-metrics:';
const ROUNDS_LIST_KEY = 'rounds-list';
const HUMAN_RATINGS_LIST_KEY = 'human-ratings-list';
const EVAL_METRICS_LIST_KEY = 'eval-metrics-list';

export async function getModelRating(modelId: string): Promise<ModelRating | undefined> {
  return kvGet(`${RATINGS_KEY}${modelId}`);
}

export async function getAllRatings(): Promise<ModelRating[]> {
  const ratings = await kvGetAll(`${RATINGS_KEY}*`);
  return ratings.sort((a, b) => b.eloRating - a.eloRating);
}

export async function updateModelRating(rating: ModelRating): Promise<void> {
  await kvSet(`${RATINGS_KEY}${rating.modelId}`, rating);
}

export async function saveRoundResult(result: RoundResult): Promise<void> {
  const roundKey = `${ROUNDS_KEY}${result.roundId}`;
  await kvSet(roundKey, result);
  
  // Keep track of round IDs for retrieval
  const roundsList = (await kvGet(ROUNDS_LIST_KEY)) || [];
  
  // Only add if not already present
  if (!roundsList.includes(result.roundId)) {
    roundsList.push(result.roundId);
    
    // Keep only last 1000 rounds
    if (roundsList.length > 1000) {
      const oldRoundId = roundsList.shift();
      if (oldRoundId) {
        await kvDelete(`${ROUNDS_KEY}${oldRoundId}`);
      }
    }
    
    await kvSet(ROUNDS_LIST_KEY, roundsList);
  }
}

export async function getRecentRounds(limit: number = 10): Promise<RoundResult[]> {
  const roundsList = (await kvGet(ROUNDS_LIST_KEY)) || [];
  // Deduplicate just in case
  const uniqueIds = Array.from(new Set(roundsList)) as string[];
  const recentIds = uniqueIds.slice(-limit).reverse();
  
  const rounds: RoundResult[] = [];
  for (const roundId of recentIds) {
    const round = await kvGet(`${ROUNDS_KEY}${roundId}`);
    if (round) {
      rounds.push(round);
    }
  }
  
  return rounds;
}

export async function getLeaderboard() {
  const allRatings = await getAllRatings();
  
  return {
    overall: allRatings,
    byMetric: {
      feasibility: [...allRatings].sort(
        (a, b) => b.bestMetric.feasibility - a.bestMetric.feasibility
      ),
      optimality: [...allRatings].sort(
        (a, b) => b.bestMetric.optimality - a.bestMetric.optimality
      ),
      clarity: [...allRatings].sort(
        (a, b) => b.bestMetric.clarity - a.bestMetric.clarity
      ),
      llmJudge: [...allRatings].sort(
        (a, b) => (b.bestMetric.llmJudge || 0) - (a.bestMetric.llmJudge || 0)
      ),
      humanRating: [...allRatings].sort(
        (a, b) => b.averageHumanRating - a.averageHumanRating
      ),
    },
  };
}

export async function saveHumanRating(rating: HumanRating): Promise<void> {
  const ratingsList = (await kvGet(HUMAN_RATINGS_LIST_KEY)) || [];
  
  // Only add if not already present
  if (!ratingsList.includes(rating.roundId)) {
    ratingsList.push(rating.roundId);
    
    if (ratingsList.length > 5000) {
      const oldRoundId = ratingsList.shift();
      if (oldRoundId) {
        await kvDelete(`${HUMAN_RATINGS_KEY}${oldRoundId}`);
      }
    }
    
    await kvSet(HUMAN_RATINGS_LIST_KEY, ratingsList);
  }
  
  await kvSet(`${HUMAN_RATINGS_KEY}${rating.roundId}`, rating);
}

export async function getHumanRatingsForRound(roundId: string): Promise<HumanRating[]> {
  const rating = await kvGet(`${HUMAN_RATINGS_KEY}${roundId}`);
  return rating ? [rating] : [];
}

export async function getHumanRatingsForModel(modelId: string): Promise<HumanRating[]> {
  const ratingsList = (await kvGet(HUMAN_RATINGS_LIST_KEY)) || [];
  const ratings: HumanRating[] = [];
  
  const uniqueIds = Array.from(new Set(ratingsList)) as string[];
  
  for (const roundId of uniqueIds) {
    const rating = await kvGet(`${HUMAN_RATINGS_KEY}${roundId}`);
    if (rating && rating.modelId === modelId) {
      ratings.push(rating);
    }
  }
  
  return ratings;
}

export async function saveEvalMetrics(metrics: EvalMetrics): Promise<void> {
  const metricsList = (await kvGet(EVAL_METRICS_LIST_KEY)) || [];
  
  // Only add if not already present
  if (!metricsList.includes(metrics.roundId)) {
    metricsList.push(metrics.roundId);
    
    if (metricsList.length > 1000) {
      const oldRoundId = metricsList.shift();
      if (oldRoundId) {
        await kvDelete(`${EVAL_METRICS_KEY}${oldRoundId}`);
      }
    }
    
    await kvSet(EVAL_METRICS_LIST_KEY, metricsList);
  }
  
  await kvSet(`${EVAL_METRICS_KEY}${metrics.roundId}`, metrics);
}

export async function getEvalMetrics(limit: number = 100): Promise<EvalMetrics[]> {
  const metricsList = (await kvGet(EVAL_METRICS_LIST_KEY)) || [];
  // Deduplicate just in case
  const uniqueIds = Array.from(new Set(metricsList)) as string[];
  const recentIds = uniqueIds.slice(-limit).reverse();
  
  const metrics: EvalMetrics[] = [];
  for (const roundId of recentIds) {
    const metric = await kvGet(`${EVAL_METRICS_KEY}${roundId}`);
    if (metric) {
      metrics.push(metric);
    }
  }
  
  return metrics;
}