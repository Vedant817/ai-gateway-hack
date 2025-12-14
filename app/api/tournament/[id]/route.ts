import { NextResponse } from 'next/server';
import { getTournament } from '@/lib/storage';

export async function GET(
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

    return NextResponse.json(tournament);
  } catch (error) {
    console.error(`Failed to retrieve tournament ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
