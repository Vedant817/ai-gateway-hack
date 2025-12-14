import { NextResponse } from 'next/server';
import { getChallenge, saveChallenge } from '@/lib/storage';
import { ModelSolution } from '@/types/game';
import { validateAndScore } from '@/lib/validator';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const challengeId = params.id;
    const { userId, solution } = (await request.json()) as {
      userId: string;
      solution: ModelSolution;
    };

    if (!userId || !solution) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const challenge = await getChallenge(challengeId);

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found.' }, { status: 404 });
    }

    const score = validateAndScore(challenge.puzzle, solution);

    challenge.submissions.push({
      userId,
      solution,
      score,
      submittedAt: new Date().toISOString(),
    });

    // Sort submissions by score, descending
    challenge.submissions.sort((a, b) => b.score.totalScore - a.score.totalScore);

    await saveChallenge(challenge);

    return NextResponse.json(challenge, { status: 200 });
  } catch (error) {
    console.error(`Failed to submit to challenge ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
