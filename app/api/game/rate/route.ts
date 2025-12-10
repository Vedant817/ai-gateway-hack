/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import * as storage from '@/lib/storage';
import { HumanRating } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundId, modelId, rating, feedback } = body as {
      roundId: string;
      modelId: string;
      rating: number;
      feedback?: string;
    };

    if (!roundId || !modelId || !rating) {
      return NextResponse.json(
        { success: false, error: 'roundId, modelId, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Generate a simple user ID (in production, use actual auth)
    const userId = request.headers.get('x-user-id') || `user-${Date.now()}`;

    const humanRating: HumanRating = {
      roundId,
      userId,
      modelId: modelId as any,
      rating,
      feedback,
      timestamp: new Date().toISOString(),
    };

    storage.saveHumanRating(humanRating);

    return NextResponse.json({
      success: true,
      rating: humanRating,
    });
  } catch (error: any) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save rating' },
      { status: 500 }
    );
  }
}

