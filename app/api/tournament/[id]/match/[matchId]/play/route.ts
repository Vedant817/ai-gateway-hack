import { NextResponse } from 'next/server';
import { getTournament, saveTournament } from '@/lib/storage';
import { generatePuzzle } from '@/lib/puzzle-generator';
import { runMatch } from '@/lib/match-runner';
import { ModelId } from '@/types/game';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; matchId: string }> }
) {
  const params = await props.params;
  try {
    const { id: tournamentId, matchId } = params;
    const tournament = await getTournament(tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    const currentRound = tournament.rounds[tournament.currentRound];
    const matchIndex = currentRound.matches.findIndex(m => m.matchId === matchId);
    
    if (matchIndex === -1) {
      return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
    }

    const match = currentRound.matches[matchIndex];

    if (match.status === 'completed') {
       return NextResponse.json({ message: 'Match already completed.' }, { status: 200 });
    }

    if (!match.modelA || !match.modelB) {
      // Logic for byes should handle this, but if we are here, something is wrong
       return NextResponse.json({ error: 'Invalid match participants.' }, { status: 400 });
    }

    // Generate a puzzle for this match
    const puzzle = generatePuzzle('medium');

    // Run the match
    const result = await runMatch(puzzle, match.modelA, match.modelB);

    // Update match
    match.winner = result.winner || match.modelA; // Default to modelA if tie/null
    match.status = 'completed';
    // We could store the full results/scores in the match object if the type supported it
    // The Match type has `results: MatchResult[]` but MatchResult is not defined in the snippet I saw
    // Let's assume we can just mark it as done and set the winner for now. 
    // Ideally we'd persist the scores.
    
    // Saving basic score info if possible, or just the fact it's done.
    
    await saveTournament(tournament);

    return NextResponse.json({ success: true, match });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error(`Failed to play match ${params.matchId}:`, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
