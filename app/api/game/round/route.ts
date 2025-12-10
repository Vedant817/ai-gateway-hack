/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { updateRatings, updateModelRating } from '@/lib/rating';
import * as storage from '@/lib/storage';
import { RoundResult, SolutionScore, ModelId, EvalMetrics } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puzzle, solutions, scores, winner } = body as {
      puzzle: any;
      solutions: any[];
      scores: SolutionScore[];
      winner: ModelId;
    };

    // Save eval metrics
    const roundId = `round-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const evalMetrics: EvalMetrics = {
      roundId,
      timestamp: new Date().toISOString(),
      puzzleType: puzzle.type,
      difficulty: puzzle.difficulty,
      metrics: {
        feasibility: {} as Record<ModelId, number>,
        optimality: {} as Record<ModelId, number>,
        clarity: {} as Record<ModelId, number>,
        llmJudge: {} as Record<ModelId, number>,
        humanRating: {} as Record<ModelId, number>,
      },
    };

    scores.forEach((score) => {
      evalMetrics.metrics.feasibility[score.modelId] = score.feasibility;
      evalMetrics.metrics.optimality[score.modelId] = score.optimality;
      evalMetrics.metrics.clarity[score.modelId] = score.clarity;
      if (score.llmJudgeScore !== undefined) {
        evalMetrics.metrics.llmJudge[score.modelId] = score.llmJudgeScore;
      }
    });

    await storage.saveEvalMetrics(evalMetrics);

    if (!puzzle || !scores || !winner) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate ELO changes
    const eloChanges = updateRatings(scores);

    // Update ratings for all models
    for (const score of scores) {
      const currentRating = await storage.getModelRating(score.modelId);
      const eloChange = eloChanges.get(score.modelId) || 0;
      const won = score.modelId === winner;
      
      const updatedRating = await updateModelRating(
        currentRating,
        score,
        won,
        eloChange,
        puzzle.difficulty
      );
      
      await storage.updateModelRating(updatedRating);
    }

    // Save round result
    const roundResult: RoundResult = {
      roundId,
      puzzle,
      solutions,
      scores,
      winner,
      timestamp: new Date().toISOString(),
    };

    await storage.saveRoundResult(roundResult);

    return NextResponse.json({
      success: true,
      roundId: roundResult.roundId,
    });
  } catch (error: any) {
    console.error('Error completing round:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete round' },
      { status: 500 }
    );
  }
}

