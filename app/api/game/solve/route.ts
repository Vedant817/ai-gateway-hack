/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { modelMap } from '@/lib/ai-gateway';
import { buildPrompt } from '@/lib/prompt-builder';
import { validateAndScore } from '@/lib/validator';
import { evaluateAllSolutions } from '@/lib/llm-judge';
import { getCachedSolution, setCachedSolution } from '@/lib/cache';
import { PuzzleInstance, ModelId, ModelSolution, SolutionScore } from '@/types/game';

const DEFAULT_MODELS: ModelId[] = [
  'grok-code-fast-1',
  'grok-4-fast-reasoning',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
  'claude-opus-4.5',
  'claude-3.7-sonnet',
  'gpt-4.1-mini',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-pro-preview',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puzzle, models = DEFAULT_MODELS } = body as {
      puzzle: PuzzleInstance;
      models?: ModelId[];
    };

    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: 'Puzzle is required' },
        { status: 400 }
      );
    }

    // Check cache first (semantic-ish)
    const cached = await getCachedSolution(puzzle);
    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        cached: true,
      });
    }

    const prompt = buildPrompt(puzzle);
    const startTime = Date.now();

    // Call all models in parallel
    const modelPromises = models.map(async (modelId): Promise<ModelSolution> => {
      try {
        const model = modelMap[modelId];
        if (!model) {
          throw new Error(`Model ${modelId} not found`);
        }

        const result = await generateText({
          model,
          prompt,
          temperature: 0.3,
        });

        const rawResponse = result.text;
        let scheduledMeetings: any[] = [];
        let parseError: string | undefined;

        try {
          // Try to extract JSON from response
          // Find the first '[' and parse from there
          const startIdx = rawResponse.indexOf('[');
          if (startIdx !== -1) {
            // Try to find the matching closing bracket, accounting for strings
            let bracketCount = 0;
            let endIdx = -1;
            let inString = false;
            let escapeNext = false;
            for (let i = startIdx; i < rawResponse.length; i++) {
              const char = rawResponse[i];
              
              if (escapeNext) {
                escapeNext = false;
                continue;
              }
              
              if (char === '\\') {
                escapeNext = true;
                continue;
              }
              
              if (char === '"') {
                inString = !inString;
                continue;
              }
              
              if (!inString) {
                if (char === '[' || char === '{') {
                  bracketCount++;
                } else if (char === ']' || char === '}') {
                  bracketCount--;
                  if (bracketCount === 0 && char === ']') {
                    endIdx = i;
                    break;
                  }
                }
              }
            }
            if (endIdx !== -1) {
              const jsonStr = rawResponse.substring(startIdx, endIdx + 1);
              scheduledMeetings = JSON.parse(jsonStr);
            }
          }
        } catch (e) {
          parseError = `Failed to parse JSON: ${e}`;
        }

        return {
          modelId,
          rawResponse,
          scheduledMeetings,
          explanation: rawResponse.length > 500 ? rawResponse.substring(0, 500) + '...' : rawResponse,
          parseError,
        };
      } catch (error: any) {
        return {
          modelId,
          rawResponse: '',
          scheduledMeetings: [],
          parseError: error.message || 'Unknown error',
        };
      }
    });

    const solutionsWithTiming = await Promise.all(
      modelPromises.map(async (p) => {
        const t0 = Date.now();
        const res = await p;
        return { ...res, responseTime: Date.now() - t0 };
      })
    );
    const solutions = solutionsWithTiming;
    const responseTime = Date.now() - startTime;

    // Validate and score all solutions
    const scores: SolutionScore[] = solutions.map((solution) => {
      const score = validateAndScore(puzzle, solution);
      return {
        ...score,
        responseTime: solution.responseTime ?? responseTime / solutions.length,
      };
    });

    // LLM-as-judge evaluation (in parallel)
    try {
      const llmScores = await evaluateAllSolutions(puzzle, solutions);
      // Add LLM judge scores to existing scores
      scores.forEach((score) => {
        score.llmJudgeScore = llmScores[score.modelId] || 0.5;
        // Update total score to include LLM judge (10% weight)
        score.totalScore = score.feasibility * 0.45 + score.optimality * 0.27 + score.clarity * 0.18 + (score.llmJudgeScore || 0) * 0.1;
      });
    } catch (error) {
      console.error('LLM judge evaluation failed:', error);
      // Continue without LLM judge scores
    }

    // Determine winner
    const winner = scores.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best
    ).modelId;

    const payload = {
      success: true,
      solutions,
      scores,
      winner,
      responseTime,
      cached: false,
    };

    // Cache the result for similar puzzles
    await setCachedSolution(puzzle, payload);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Error solving puzzle:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to solve puzzle' },
      { status: 500 }
    );
  }
}

