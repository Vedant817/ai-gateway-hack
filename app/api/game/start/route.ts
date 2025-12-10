// API route to start a new game round

import { NextRequest, NextResponse } from 'next/server';
import { createPuzzle } from '@/lib/puzzle-factory';
import { PuzzleInstance, Difficulty, PuzzleType } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      difficulty = 'medium',
      puzzleType = 'meeting-scheduler',
      seed
    } = body as { 
      difficulty?: Difficulty;
      puzzleType?: PuzzleType;
      seed?: string;
    };

    const puzzle = createPuzzle(puzzleType, difficulty, seed);

    return NextResponse.json({
      success: true,
      puzzle,
    });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate puzzle' },
      { status: 500 }
    );
  }
}

