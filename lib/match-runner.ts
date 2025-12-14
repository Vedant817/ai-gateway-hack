import { generateText } from 'ai';
import { modelMap } from '@/lib/ai-gateway';
import { buildPrompt } from '@/lib/prompt-builder';
import { validateAndScore } from '@/lib/validator';
import { PuzzleInstance, ModelId, ModelSolution, SolutionScore } from '@/types/game';

interface MatchResult {
  winner: ModelId | null; // null if draw
  scores: Partial<Record<ModelId, SolutionScore>>;
  solutions: Partial<Record<ModelId, ModelSolution>>;
}

export async function runMatch(
  puzzle: PuzzleInstance,
  modelAId: ModelId,
  modelBId: ModelId
): Promise<MatchResult> {
  const models = [modelAId, modelBId];
  const prompt = buildPrompt(puzzle);

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
        const startIdx = rawResponse.indexOf('[');
        if (startIdx !== -1) {
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

  const solutionsList = await Promise.all(modelPromises);
  const solutionsMap: Partial<Record<ModelId, ModelSolution>> = {};
  solutionsList.forEach(s => solutionsMap[s.modelId] = s);

  const scoresList = solutionsList.map(solution => validateAndScore(puzzle, solution));
  const scoresMap: Partial<Record<ModelId, SolutionScore>> = {};
  scoresList.forEach(s => scoresMap[s.modelId] = s);

  // Determine winner
  let winner: ModelId | null = null;
  if (scoresList[0].totalScore > scoresList[1].totalScore) {
    winner = scoresList[0].modelId;
  } else if (scoresList[1].totalScore > scoresList[0].totalScore) {
    winner = scoresList[1].modelId;
  } else {
    // Tie breaker? For now, random or null. Let's pick A to avoid stalls in tournament
    winner = scoresList[0].modelId; 
  }

  return {
    winner,
    scores: scoresMap,
    solutions: solutionsMap,
  };
}
