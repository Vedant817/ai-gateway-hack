import { NextResponse } from 'next/server';
import { getTournament, saveTournament } from '@/lib/storage';
import { advanceTournamentRound } from '@/lib/tournament-logic';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const tournamentId = params.id;
    const tournament = await getTournament(tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found.' }, { status: 404 });
    }

    if (tournament.status !== 'active') {
      return NextResponse.json(
        { error: 'Tournament is not active.' },
        { status: 400 }
      );
    }

    const updatedTournament = advanceTournamentRound(tournament);
    await saveTournament(updatedTournament);

    return NextResponse.json(updatedTournament);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error(`Failed to advance tournament ${params.id}:`, error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
