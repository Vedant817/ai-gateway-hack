import { NextResponse } from 'next/server';
import { getChallenge, saveChallenge } from '@/lib/storage';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const challengeId = params.id;
    const challenge = await getChallenge(challengeId);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found.' }, { status: 404 });
    }

    challenge.votes += 1;

    await saveChallenge(challenge);

    return NextResponse.json(challenge, { status: 200 });
  } catch (error) {
    console.error(`Failed to vote on challenge ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
