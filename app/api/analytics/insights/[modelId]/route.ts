import { NextResponse } from 'next/server';
import { generateModelComparison } from '@/lib/analytics';
import { ModelId } from '@/types/game';
import { getAllRatings } from '@/lib/storage';

export async function GET(
  request: Request,
  props: { params: Promise<{ modelId: string }> }
) {
  const params = await props.params;
  try {
    const modelId = params.modelId as ModelId;
    const allRatings = await getAllRatings();
    const allModelIds = allRatings.map(r => r.modelId);

    // For this example, we'll generate a comparison against all other models
    // to derive insights. This is computationally expensive and should be optimized
    // in a real application.
    const comparison = await generateModelComparison(allModelIds);

    const modelInsights = comparison.insights[modelId];

    if (!modelInsights) {
      return NextResponse.json({ error: 'Insights not found for this model.' }, { status: 404 });
    }

    return NextResponse.json(modelInsights);
  } catch (error) {
    console.error(`Failed to get insights for model ${params.modelId}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
