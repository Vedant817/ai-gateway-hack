'use client';

import { useState } from 'react';
import { ModelId, SolutionScore } from '@/types/game';

interface HumanRatingProps {
  roundId: string;
  scores: SolutionScore[];
  onRated?: () => void;
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

export default function HumanRating({ roundId, scores, onRated }: HumanRatingProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleRate(modelId: string, rating: number) {
    setRatings((prev) => ({ ...prev, [modelId]: rating }));

    try {
      setSubmitting(true);
      await fetch('/api/game/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          modelId,
          rating,
        }),
      });
      onRated?.();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 text-black">
      <h3 className="font-semibold">Rate the Solutions</h3>
      <p className="text-sm text-black">
        Help improve the evaluation by rating how useful each solution would be in practice
      </p>
      <div className="space-y-3">
        {scores.map((score) => (
          <div key={score.modelId} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{MODEL_NAMES[score.modelId]}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(score.modelId, star)}
                    disabled={submitting}
                    className={`text-2xl ${
                      ratings[score.modelId] >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    } disabled:opacity-50`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            {ratings[score.modelId] && (
              <p className="text-xs text-black">
                You rated this {ratings[score.modelId]}/5
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

