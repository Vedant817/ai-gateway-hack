'use client';

import { useEffect, useState } from 'react';
import { EvalMetrics, ModelId } from '@/types/game';

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
  'grok-code-fast-1': '#f59e0b',
  'grok-4-fast-reasoning': '#fb923c',
  'claude-sonnet-4.5': '#a855f7',
  'claude-haiku-4.5': '#c084fc',
  'claude-opus-4.5': '#7c3aed',
  'claude-3.7-sonnet': '#6366f1',
  'gpt-4.1-mini': '#3b82f6',
  'gemini-2.5-flash-lite': '#6ee7b7',
  'gemini-2.5-flash': '#10b981',
  'gemini-3-pro-preview': '#059669',
};

export default function EvalDashboard() {
  const [metrics, setMetrics] = useState<EvalMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'feasibility' | 'optimality' | 'clarity' | 'llmJudge'>('feasibility');

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/eval/metrics?limit=50');
        const data = await response.json();
        if (data.success) {
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-blue-50 to-indigo-50 p-12 text-center">
        <div className="mb-4 text-4xl">📊</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-800">No metrics yet</h3>
        <p className="text-gray-600">Play some rounds to see performance over time!</p>
      </div>
    );
  }

  // Prepare data for chart
  const modelIds: ModelId[] = [
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
  const maxValue = 1.0;
  const chartHeight = 280;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Evaluation Dashboard</h1>
          <p className="mt-2 text-gray-600">Track model performance across key metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Metric:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'feasibility' | 'optimality' | 'clarity' | 'llmJudge')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="feasibility">Feasibility</option>
            <option value="optimality">Optimality</option>
            <option value="clarity">Clarity</option>
            <option value="llmJudge">LLM Judge</option>
          </select>
        </div>
      </div>

      {/* Main Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{selectedMetric} Over Time</h2>
            <p className="mt-1 text-sm text-gray-600">Performance trend across all models</p>
          </div>
        </div>
        
        <div className="relative" style={{ height: `${chartHeight + 60}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 flex h-full flex-col justify-between pr-4 text-right text-xs font-medium text-gray-500">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Grid lines */}
          <div className="absolute left-12 top-0 h-full w-full border-l border-gray-200">
            <div className="relative h-full">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(i / 4) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Chart area */}
          <div className="relative ml-16 h-full">
            <svg width="100%" height={chartHeight} className="overflow-visible">
              {modelIds.map((modelId) => {
                const points = metrics
                  .map((m, idx) => {
                    const value = m.metrics[selectedMetric][modelId];
                    if (value === undefined) return null;
                    const x = (idx / (metrics.length - 1 || 1)) * 100;
                    const y = chartHeight - (value / maxValue) * chartHeight;
                    return { x: `${x}%`, y };
                  })
                  .filter((p): p is { x: string; y: number } => p !== null);

                if (points.length === 0) return null;

                const pathData = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <g key={modelId}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={MODEL_COLORS[modelId]}
                      strokeWidth="3"
                      opacity="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill={MODEL_COLORS[modelId]}
                        opacity="0.9"
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {modelIds.map((modelId) => (
            <div key={modelId} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <div
                className="h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: MODEL_COLORS[modelId] }}
              />
              <span className="text-xs font-medium text-gray-700">{MODEL_NAMES[modelId]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Average Performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {modelIds.map((modelId) => {
            const values = metrics
              .map((m) => m.metrics[selectedMetric][modelId])
              .filter((v): v is number => v !== undefined);
            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

            return (
              <div
                key={modelId}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {MODEL_NAMES[modelId]}
                    </p>
                  </div>
                  {trend > 0 && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      ↑ {(trend * 100).toFixed(1)}%
                    </span>
                  )}
                  {trend < 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                      ↓ {(Math.abs(trend) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900">{(avg * 100).toFixed(1)}%</div>
                  <p className="text-xs text-gray-500">avg {selectedMetric}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${avg * 100}%`,
                      backgroundColor: MODEL_COLORS[modelId],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

