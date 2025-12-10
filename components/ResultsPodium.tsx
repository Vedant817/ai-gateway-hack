'use client';

import { SolutionScore, ModelId } from '@/types/game';

interface ResultsPodiumProps {
  scores: SolutionScore[];
  winner: ModelId;
}

const MODEL_NAMES: Record<ModelId, string> = {
  'grok-code-fast-1': 'Grok Code Fast',
  'grok-4-fast-reasoning': 'Grok 4 Fast',
  'claude-sonnet-4.5': 'Claude Sonnet 4.5',
  'claude-haiku-4.5': 'Claude Haiku 4.5',
  'claude-opus-4.5': 'Claude Opus 4.5',
  'claude-3.7-sonnet': 'Claude 3.7 Sonnet',
  'gpt-4.1-mini': 'GPT-4.1 Mini',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
};

export default function ResultsPodium({ scores, winner }: ResultsPodiumProps) {
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  const top3 = sorted.slice(0, 3);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-center">Round Results</h3>
      
      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {top3.length >= 2 && (
          <div className={`flex flex-col items-center ${top3[1]?.modelId === winner ? 'order-2' : 'order-1'}`}>
            <div className="mb-2 text-2xl">{getMedal(1)}</div>
            <div className="w-24 rounded-t-lg bg-gray-300 p-4 text-center">
              <div className="font-semibold">{MODEL_NAMES[top3[1]?.modelId]}</div>
              <div className="text-sm">{(top3[1]?.totalScore * 100).toFixed(1)}%</div>
            </div>
            <div className="h-16 w-24 rounded-b-lg bg-gray-300"></div>
          </div>
        )}
        
        {top3.length >= 1 && (
          <div className={`flex flex-col items-center ${top3[0]?.modelId === winner ? 'order-2' : 'order-1'}`}>
            <div className="mb-2 text-3xl">{getMedal(0)}</div>
            <div className={`w-32 rounded-t-lg p-4 text-center ${top3[0]?.modelId === winner ? 'bg-yellow-400' : 'bg-blue-400'}`}>
              <div className="font-bold">{MODEL_NAMES[top3[0]?.modelId]}</div>
              <div className="text-sm font-semibold">{(top3[0]?.totalScore * 100).toFixed(1)}%</div>
            </div>
            <div className={`h-24 w-32 rounded-b-lg ${top3[0]?.modelId === winner ? 'bg-yellow-400' : 'bg-blue-400'}`}></div>
          </div>
        )}
        
        {top3.length >= 3 && (
          <div className={`flex flex-col items-center ${top3[2]?.modelId === winner ? 'order-2' : 'order-1'}`}>
            <div className="mb-2 text-xl">{getMedal(2)}</div>
            <div className="w-20 rounded-t-lg bg-orange-300 p-3 text-center">
              <div className="text-sm font-semibold">{MODEL_NAMES[top3[2]?.modelId]}</div>
              <div className="text-xs">{(top3[2]?.totalScore * 100).toFixed(1)}%</div>
            </div>
            <div className="h-12 w-20 rounded-b-lg bg-orange-300"></div>
          </div>
        )}
      </div>

      {/* Detailed scores */}
      <div className="space-y-2">
        <h4 className="font-semibold">Detailed Scores</h4>
        {sorted.map((score, index) => (
          <div
            key={score.modelId}
            className={`rounded-lg border p-3 ${
              score.modelId === winner ? 'border-yellow-400 bg-yellow-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMedal(index)}</span>
                <span className="font-medium">{MODEL_NAMES[score.modelId]}</span>
                {score.modelId === winner && (
                  <span className="rounded bg-yellow-400 px-2 py-0.5 text-xs font-semibold">
                    WINNER
                  </span>
                )}
              </div>
              <span className="font-bold">{(score.totalScore * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-black">Feasibility</div>
                <div className="font-semibold">{(score.feasibility * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-black">Optimality</div>
                <div className="font-semibold">{(score.optimality * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-black">Clarity</div>
                <div className="font-semibold">{(score.clarity * 100).toFixed(0)}%</div>
              </div>
            </div>
            {score.violations.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                <div className="font-semibold">Violations ({score.violations.length}):</div>
                <ul className="list-disc pl-4">
                  {score.violations.slice(0, 3).map((v, i) => (
                    <li key={i}>{v.description}</li>
                  ))}
                  {score.violations.length > 3 && (
                    <li>...and {score.violations.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

