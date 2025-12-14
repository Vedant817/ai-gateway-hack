import { NextResponse } from 'next/server';
import { saveChallenge, getCommunityChallenges } from '@/lib/storage';
import { Challenge, PuzzleInstance } from '@/types/game';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);
const shareId = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export async function POST(request: Request) {
  try {
    const { name, description, puzzle, createdBy } = (await request.json()) as {
      name: string;
      description: string;
      puzzle: PuzzleInstance;
      createdBy: string;
    };

    if (!name || !description || !puzzle || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const newChallenge: Challenge = {
      id: nanoid(),
      shareCode: shareId(),
      name,
      description,
      puzzle,
      createdBy,
      submissions: [],
      votes: 0,
      category: 'community',
      createdAt: new Date().toISOString(),
    };

    await saveChallenge(newChallenge);

    return NextResponse.json(newChallenge, { status: 201 });
  } catch (error) {
    console.error('Failed to create challenge:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const communityChallenges = await getCommunityChallenges();
    return NextResponse.json(communityChallenges);
  } catch (error) {
    console.error('Failed to retrieve community challenges:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
