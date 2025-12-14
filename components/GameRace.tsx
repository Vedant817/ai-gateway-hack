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

const LOADING_STATUSES = [
  'Analyzing constraints...',
  'Parsing puzzle data...',
  'Optimizing schedule...',
  'Evaluating tradeoffs...',
  'Checking conflicts...',
  'Refining solution...',
  'Formatting output...',
  'Thinking...',
];

export default function GameRace({ puzzle, onComplete }: GameRaceProps) {
  const [solutions, setSolutions] = useState<ModelSolution[]>([]);
  const [scores, setScores] = useState<SolutionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelStatuses, setModelStatuses] = useState<Record<ModelId, string>>({} as any);

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

  useEffect(() => {
    // Initialize statuses
    const initialStatuses: any = {};
    models.forEach(m => initialStatuses[m] = 'Starting...');
    setModelStatuses(initialStatuses);

    // Status rotation interval
    const statusInterval = setInterval(() => {
      setModelStatuses(prev => {
        const next = { ...prev };
        models.forEach(m => {
          if (Math.random() > 0.7) { // Randomly update some models
             const randomStatus = LOADING_STATUSES[Math.floor(Math.random() * LOADING_STATUSES.length)];
             next[m] = randomStatus;
          }
        });
        return next;
      });
    }, 1500);

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

    solvePuzzle();

    return () => clearInterval(statusInterval);
  }, [puzzle, onComplete]);

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Live Model Status</h3>
          <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
            Processing
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {models.map((modelId) => (
            <div key={modelId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                <span className="font-medium text-gray-900">{MODEL_NAMES[modelId]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{modelStatuses[modelId] || 'Waiting...'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <span>✅</span> Solutions Received
      </h3>
      <div className="space-y-3">
        {scores.map((score) => (
          <div
            key={score.modelId}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-900">{MODEL_NAMES[score.modelId]}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                score.totalScore > 0.8 ? 'bg-green-100 text-green-700' : 
                score.totalScore > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                Score: {(score.totalScore * 100).toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Feasibility</span>
                <span className="font-semibold text-gray-900">{(score.feasibility * 100).toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Optimality</span>
                <span className="font-semibold text-gray-900">{(score.optimality * 100).toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Clarity</span>
                <span className="font-semibold text-gray-900">{(score.clarity * 100).toFixed(0)}%</span>
              </div>
            </div>
            {score.violations.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                <span className="font-bold">⚠️</span>
                <span>{score.violations.length} constraint violation(s) detected</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

