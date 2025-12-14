import { NextResponse } from 'next/server';
import { generateModelComparison } from '@/lib/analytics';
import { saveModelComparison, getModelComparison } from '@/lib/storage';
import { ModelId } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { modelIds } = (await request.json()) as { modelIds: ModelId[] };

    if (!modelIds || modelIds.length < 2) {
      return NextResponse.json(
        { error: 'At least two model IDs are required for comparison.' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedComparison = await getModelComparison(modelIds);
    if (cachedComparison) {
      return NextResponse.json(cachedComparison);
    }

    const comparison = await generateModelComparison(modelIds);
    await saveModelComparison(comparison);

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Failed to compare models:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
