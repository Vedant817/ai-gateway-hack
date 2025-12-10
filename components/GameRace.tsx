/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ModelId, PuzzleInstance, ModelSolution, SolutionScore } from '@/types/game';

interface GameRaceProps {
  puzzle: PuzzleInstance;
  onComplete: (solutions: ModelSolution[], scores: SolutionScore[], winner: ModelId) => void;
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

const MODEL_COLORS: Record<ModelId, string> = {
  'grok-code-fast-1': 'bg-orange-500',
  'grok-4-fast-reasoning': 'bg-orange-300',
  'claude-sonnet-4.5': 'bg-purple-500',
  'claude-haiku-4.5': 'bg-purple-300',
  'claude-opus-4.5': 'bg-purple-700',
  'claude-3.7-sonnet': 'bg-indigo-500',
  'gpt-4.1-mini': 'bg-blue-500',
  'gemini-2.5-flash-lite': 'bg-green-300',
  'gemini-2.5-flash': 'bg-green-500',
  'gemini-3-pro-preview': 'bg-green-700',
};

export default function GameRace({ puzzle, onComplete }: GameRaceProps) {
  const [solutions, setSolutions] = useState<ModelSolution[]>([]);
  const [scores, setScores] = useState<SolutionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Partial<Record<ModelId, number>>>({});

  useEffect(() => {
    async function solvePuzzle() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/game/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puzzle }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to solve puzzle');
        }

        setSolutions(data.solutions);
        setScores(data.scores);
        onComplete(data.solutions, data.scores, data.winner);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }

    // Simulate progress animation
    const models: ModelId[] = [
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

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = { ...prev };
        models.forEach((modelId) => {
          if (!next[modelId]) next[modelId] = 0;
          if (next[modelId] < 90) {
            next[modelId] += Math.random() * 15;
          }
        });
        return next;
      });
    }, 200);

    solvePuzzle();

    return () => clearInterval(progressInterval);
  }, [puzzle, onComplete]);

  const models: ModelId[] = [
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

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Models are solving the puzzle...</h3>
        <div className="space-y-3">
          {models.map((modelId) => (
            <div key={modelId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{MODEL_NAMES[modelId]}</span>
                <span className="text-black">
                  {Math.round(progress[modelId] ?? 0)}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full transition-all duration-300 ${MODEL_COLORS[modelId]}`}
                  style={{ width: `${progress[modelId] ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Solutions received!</h3>
      <div className="space-y-2">
        {scores.map((score) => (
          <div
            key={score.modelId}
            className="rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{MODEL_NAMES[score.modelId]}</span>
              <span className="text-sm font-semibold">
                Score: {(score.totalScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-black">Feasibility:</span>{' '}
                <span className="font-medium">
                  {(score.feasibility * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-black">Optimality:</span>{' '}
                <span className="font-medium">
                  {(score.optimality * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-black">Clarity:</span>{' '}
                <span className="font-medium">
                  {(score.clarity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {score.violations.length > 0 && (
              <div className="mt-2 text-xs text-red-600">
                {score.violations.length} violation(s)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

