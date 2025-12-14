import { NextResponse } from 'next/server';
import { generateModelComparison } from '@/lib/analytics';
import { ModelId } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { modelIds } = (await request.json()) as { modelIds: ModelId[] };

    if (!modelIds || modelIds.length !== 2) {
      return NextResponse.json(
        { error: 'Exactly two model IDs are required for prediction.' },
        { status: 400 }
      );
    }

    const comparison = await generateModelComparison(modelIds);
    const [modelA, modelB] = modelIds;
    const headToHeadKey = `${modelA}_vs_${modelB}`;
    const headToHead = comparison.headToHead[headToHeadKey];

    let prediction: ModelId | 'tie' = 'tie';
    if (headToHead) {
      if (headToHead.wins > headToHead.losses) {
        prediction = modelA;
      } else if (headToHead.losses > headToHead.wins) {
        prediction = modelB;
      }
    }

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Failed to predict winner:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
