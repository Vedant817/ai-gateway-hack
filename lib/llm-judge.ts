import { generateText } from 'ai';
import { modelMap } from '@/lib/ai-gateway';
import { PuzzleInstance, ModelSolution, ModelId } from '@/types/game';

const JUDGE_MODEL: ModelId = 'gpt-4.1-mini'; 

export async function evaluateWithLLM(
  puzzle: PuzzleInstance,
  solution: ModelSolution
): Promise<number> {
  try {
    const judgeModel = modelMap[JUDGE_MODEL];
    if (!judgeModel) {
      return 0.5;
    }

    const prompt = `You are evaluating an AI-generated solution to a constraint planning problem.

## Problem Context
Type: ${puzzle.type}
Objective: ${puzzle.objective}
${puzzle.persona ? `Persona: ${puzzle.persona.name} - ${puzzle.persona.scenario}` : ''}

## Solution to Evaluate
Model: ${solution.modelId}
Raw Response:
${solution.rawResponse.substring(0, 2000)}

Parsed Solution:
${JSON.stringify(solution.scheduledMeetings, null, 2)}

## Evaluation Criteria
Rate this solution on a scale of 0.0 to 1.0 based on:
1. **Clarity and Usability** (0.3): Is the solution easy to understand and implement?
2. **Practicality** (0.3): Would this solution work well in the real-world scenario?
3. **Explanation Quality** (0.2): Does the explanation help users understand the reasoning?
4. **User-Friendliness** (0.2): Is the format suitable for the target persona/use case?

Respond with ONLY a JSON object in this exact format:
{
  "score": 0.85,
  "reasoning": "Brief explanation of the score"
}`;

    const result = await generateText({
      model: judgeModel,
      prompt,
      temperature: 0.2, // Lower temperature for consistent judging
    });

    // Parse the JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Math.max(0, Math.min(1, parsed.score || 0.5));
    }

    return 0.5; // Default if parsing fails
  } catch (error) {
    console.error('LLM judge error:', error);
    return 0.5; // Default score on error
  }
}

export async function evaluateAllSolutions(
  puzzle: PuzzleInstance,
  solutions: ModelSolution[]
): Promise<Record<ModelId, number>> {
  const scores: Record<ModelId, number> = {} as Record<ModelId, number>;

  // Evaluate all solutions in parallel
  const evaluations = await Promise.all(
    solutions.map(async (solution) => {
      const score = await evaluateWithLLM(puzzle, solution);
      return { modelId: solution.modelId, score };
    })
  );

  evaluations.forEach(({ modelId, score }) => {
    scores[modelId] = score;
  });

  return scores;
}

