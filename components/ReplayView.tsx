'use client';

import { useState } from 'react';
import { RoundResult, ModelId } from '@/types/game';

interface ReplayViewProps {
  roundResult: RoundResult;
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

export default function ReplayView({ roundResult }: ReplayViewProps) {
  const [expandedModel, setExpandedModel] = useState<ModelId | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Replay: Model Outputs</h3>
      <p className="text-sm text-black">
        Review each model&apos;s raw output and see why the validator scored them differently
      </p>

      <div className="space-y-3">
        {roundResult.solutions.map((solution) => {
          const score = roundResult.scores.find((s) => s.modelId === solution.modelId);
          const isExpanded = expandedModel === solution.modelId;

          return (
            <div
              key={solution.modelId}
              className="rounded-lg border bg-white p-4 text-black"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{MODEL_NAMES[solution.modelId]}</div>
                  {score && (
                    <div className="text-sm text-black">
                      Score: {(score.totalScore * 100).toFixed(1)}% |{' '}
                      Feasibility: {(score.feasibility * 100).toFixed(0)}% |{' '}
                      Optimality: {(score.optimality * 100).toFixed(0)}% |{' '}
                      Clarity: {(score.clarity * 100).toFixed(0)}%
                      {score.llmJudgeScore !== undefined && (
                        <> | LLM Judge: {(score.llmJudgeScore * 100).toFixed(0)}%</>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setExpandedModel(isExpanded ? null : solution.modelId)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 text-sm font-medium">Raw Response</div>
                    <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs">
                      {solution.rawResponse || 'No response'}
                    </pre>
                  </div>

                  {solution.parseError && (
                    <div className="rounded bg-red-50 p-2 text-sm text-red-800">
                      <div className="font-medium">Parse Error:</div>
                      <div>{solution.parseError}</div>
                    </div>
                  )}

                  {solution.scheduledMeetings.length > 0 && (
                    <div>
                      <div className="mb-1 text-sm font-medium">
                        Parsed Solution ({solution.scheduledMeetings.length} meetings)
                      </div>
                      <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs">
                        {JSON.stringify(solution.scheduledMeetings, null, 2)}
                      </pre>
                    </div>
                  )}

                  {score && score.violations.length > 0 && (
                    <div>
                      <div className="mb-1 text-sm font-medium text-red-600">
                        Violations ({score.violations.length})
                      </div>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
                        {score.violations.map((v, i) => (
                          <li key={i}>{v.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

