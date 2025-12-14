import { ModelRating, RoundResult, HumanRating, EvalMetrics, Tournament, Challenge, ModelComparison } from '@/types/game';
import { kvSet, kvGet, kvGetAll, kvDelete } from './kv-client';

const RATINGS_KEY = 'ratings:';
const ROUNDS_KEY = 'rounds:';
const HUMAN_RATINGS_KEY = 'human-ratings:';
const EVAL_METRICS_KEY = 'eval-metrics:';
const ROUNDS_LIST_KEY = 'rounds-list';
const HUMAN_RATINGS_LIST_KEY = 'human-ratings-list';
const EVAL_METRICS_LIST_KEY = 'eval-metrics-list';

const TOURNAMENTS_KEY = 'tournaments:';
const TOURNAMENTS_LIST_KEY = 'tournaments-list';
const ACTIVE_TOURNAMENTS_LIST_KEY = 'active-tournaments-list';

const CHALLENGES_KEY = 'challenges:';
const CHALLENGES_LIST_KEY = 'challenges-list';
const DAILY_CHALLENGE_KEY = 'daily-challenge';

const COMPARISON_KEY = 'comparisons:';

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

// Tournament Storage
export async function saveTournament(tournament: Tournament): Promise<void> {
  await kvSet(`${TOURNAMENTS_KEY}${tournament.id}`, tournament);

  const allTournaments = (await kvGet(TOURNAMENTS_LIST_KEY)) || [];
  if (!allTournaments.includes(tournament.id)) {
    allTournaments.push(tournament.id);
    await kvSet(TOURNAMENTS_LIST_KEY, allTournaments);
  }

  const activeTournaments = (await kvGet(ACTIVE_TOURNAMENTS_LIST_KEY)) || [];
  if (tournament.status === 'active' && !activeTournaments.includes(tournament.id)) {
    activeTournaments.push(tournament.id);
    await kvSet(ACTIVE_TOURNAMENTS_LIST_KEY, activeTournaments);
  } else if (tournament.status !== 'active' && activeTournaments.includes(tournament.id)) {
    const index = activeTournaments.indexOf(tournament.id);
    activeTournaments.splice(index, 1);
    await kvSet(ACTIVE_TOURNAMENTS_LIST_KEY, activeTournaments);
  }
}

export async function getTournament(tournamentId: string): Promise<Tournament | undefined> {
  return kvGet(`${TOURNAMENTS_KEY}${tournamentId}`);
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const tournamentIds = (await kvGet(TOURNAMENTS_LIST_KEY)) || [];
  const tournaments: Tournament[] = [];
  for (const id of tournamentIds) {
    const tournament = await getTournament(id);
    if (tournament) {
      tournaments.push(tournament);
    }
  }
  return tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getActiveTournaments(): Promise<Tournament[]> {
  const tournamentIds = (await kvGet(ACTIVE_TOURNAMENTS_LIST_KEY)) || [];
  const tournaments: Tournament[] = [];
  for (const id of tournamentIds) {
    const tournament = await getTournament(id);
    if (tournament) {
      tournaments.push(tournament);
    }
  }
  return tournaments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Challenge Storage
export async function saveChallenge(challenge: Challenge): Promise<void> {
  await kvSet(`${CHALLENGES_KEY}${challenge.id}`, challenge);

  if (challenge.category === 'daily') {
    await kvSet(DAILY_CHALLENGE_KEY, challenge.id, 86400); // 24-hour TTL
  } else {
    const challengesList = (await kvGet(CHALLENGES_LIST_KEY)) || [];
    if (!challengesList.includes(challenge.id)) {
      challengesList.push(challenge.id);
      await kvSet(CHALLENGES_LIST_KEY, challengesList);
    }
  }
}

export async function getChallenge(challengeId: string): Promise<Challenge | undefined> {
  return kvGet(`${CHALLENGES_KEY}${challengeId}`);
}

export async function getDailyChallenge(): Promise<Challenge | undefined> {
  const dailyChallengeId = await kvGet(DAILY_CHALLENGE_KEY);
  if (!dailyChallengeId) return undefined;
  return getChallenge(dailyChallengeId);
}

export async function getCommunityChallenges(limit: number = 20): Promise<Challenge[]> {
  const challengeIds = (await kvGet(CHALLENGES_LIST_KEY)) || [];
  const challenges: Challenge[] = [];
  const recentIds = challengeIds.slice(-limit).reverse();

  for (const id of recentIds) {
    const challenge = await getChallenge(id);
    if (challenge && challenge.category === 'community') {
      challenges.push(challenge);
    }
  }
  return challenges.sort((a, b) => b.votes - a.votes);
}

// Analytics Storage
function getComparisonKey(modelIds: string[]): string {
  return `${COMPARISON_KEY}${modelIds.sort().join('-')}`;
}

export async function saveModelComparison(comparison: ModelComparison): Promise<void> {
  const key = getComparisonKey(comparison.models);
  await kvSet(key, comparison, 3600); // Cache for 1 hour
}

export async function getModelComparison(modelIds: string[]): Promise<ModelComparison | undefined> {
  const key = getComparisonKey(modelIds);
  return kvGet(key);
}