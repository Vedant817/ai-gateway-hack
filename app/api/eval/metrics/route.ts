/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getEvalMetrics } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const puzzleType = searchParams.get('puzzleType');
    const difficulty = searchParams.get('difficulty');

    let metrics = await getEvalMetrics(limit);

    // Filter by puzzle type if provided
    if (puzzleType) {
      metrics = metrics.filter((m) => m.puzzleType === puzzleType);
    }

    // Filter by difficulty if provided
    if (difficulty) {
      metrics = metrics.filter((m) => m.difficulty === difficulty);
    }

    return NextResponse.json({
      success: true,
      metrics,
      count: metrics.length,
    });
  } catch (error: any) {
    console.error('Error fetching eval metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

