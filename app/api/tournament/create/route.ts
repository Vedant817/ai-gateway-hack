import { NextResponse } from 'next/server';
import { generateTournamentBracket } from '@/lib/tournament-logic';
import { saveTournament, getActiveTournaments } from '@/lib/storage';
import { ModelId, TournamentSettings } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { name, modelIds, settings } = (await request.json()) as {
      name: string;
      modelIds: ModelId[];
      settings: TournamentSettings;
    };

    if (!name || !modelIds || !settings || modelIds.length < 2) {
      return NextResponse.json(
        { error: 'Missing required fields or not enough models.' },
        { status: 400 }
      );
    }

    const newTournament = generateTournamentBracket(name, modelIds, settings);
    await saveTournament(newTournament);

    return NextResponse.json(newTournament, { status: 201 });
  } catch (error) {
    console.error('Failed to create tournament:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const activeTournaments = await getActiveTournaments();
    return NextResponse.json(activeTournaments);
  } catch (error) {
    console.error('Failed to retrieve active tournaments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
