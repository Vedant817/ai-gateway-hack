import { ModelId, Tournament, TournamentRound, Match, TournamentSettings } from '@/types/game';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);

// Fisher-Yates shuffle algorithm
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function generateTournamentBracket(name: string, modelIds: ModelId[], settings: TournamentSettings): Tournament {
  if (modelIds.length < 2) {
    throw new Error('At least two models are required to start a tournament.');
  }

  const shuffledModels = shuffle([...modelIds]);

  const matches: Match[] = [];
  const numModels = shuffledModels.length;
  const byes = numModels % 2 !== 0 ? 1 : 0;
  const numMatches = Math.floor(numModels / 2);

  let modelIndex = 0;
  for (let i = 0; i < numMatches; i++) {
    const modelA = shuffledModels[modelIndex++];
    const modelB = shuffledModels[modelIndex++];
    matches.push({
      matchId: nanoid(),
      modelA,
      modelB,
      results: [],
      status: 'pending',
    });
  }

  if (byes > 0) {
    const byeModel = shuffledModels[modelIndex];
    // In a real system, the bye model should advance automatically.
    // For simplicity here, we'll just note it. A better way is to pair it with a null opponent.
    matches.push({
        matchId: nanoid(),
        modelA: byeModel,
        modelB: null, // Represents a bye
        winner: byeModel, // Automatically wins
        results: [],
        status: 'completed',
    });
  }

  const firstRound: TournamentRound = {
    roundIndex: 0,
    matches,
  };

  const tournament: Tournament = {
    id: nanoid(),
    name,
    models: modelIds,
    rounds: [firstRound],
    currentRound: 0,
    status: 'active',
    settings,
    createdAt: new Date().toISOString(),
  };

  return tournament;
}

export function advanceTournamentRound(tournament: Tournament): Tournament {
  const currentRound = tournament.rounds[tournament.currentRound];
  if (!currentRound.matches.every(m => m.status === 'completed')) {
    throw new Error('Not all matches in the current round are completed.');
  }

  const winners = currentRound.matches.map(m => m.winner).filter(w => w) as ModelId[];

  if (winners.length === 1) {
    tournament.winner = winners[0];
    tournament.status = 'completed';
    return tournament;
  }

  const shuffledWinners = shuffle(winners);
  const nextMatches: Match[] = [];
  const numWinners = shuffledWinners.length;
  const byes = numWinners % 2 !== 0 ? 1 : 0;
  const numMatches = Math.floor(numWinners / 2);

  let winnerIndex = 0;
  for (let i = 0; i < numMatches; i++) {
    const modelA = shuffledWinners[winnerIndex++];
    const modelB = shuffledWinners[winnerIndex++];
    nextMatches.push({
      matchId: nanoid(),
      modelA,
      modelB,
      results: [],
      status: 'pending',
    });
  }

  if (byes > 0) {
    const byeModel = shuffledWinners[winnerIndex];
    nextMatches.push({
      matchId: nanoid(),
      modelA: byeModel,
      modelB: null,
      winner: byeModel,
      results: [],
      status: 'completed',
    });
  }

  const nextRound: TournamentRound = {
    roundIndex: tournament.currentRound + 1,
    matches: nextMatches,
  };

  tournament.rounds.push(nextRound);
  tournament.currentRound += 1;

  return tournament;
}
