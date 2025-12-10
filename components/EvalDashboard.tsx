'use client';

import { useEffect, useState, useMemo } from 'react';
import { EvalMetrics, ModelId } from '@/types/game';

// Ordered list of models with their IDs and display names
const ALL_MODELS: { id: ModelId; name: string; color: string }[] = [
  { id: 'grok-code-fast-1', name: 'Grok Code Fast', color: '#f59e0b' },
  { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast', color: '#fb923c' },
  { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', color: '#a855f7' },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', color: '#c084fc' },
  { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', color: '#7c3aed' },
  { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', color: '#6366f1' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', color: '#3b82f6' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', color: '#6ee7b7' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', color: '#10b981' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', color: '#059669' },
];

const MODEL_NAMES: Record<ModelId, string> = ALL_MODELS.reduce((acc, model) => {
  acc[model.id as ModelId] = model.name;
  return acc;
}, {} as Record<ModelId, string>);

const MODEL_COLORS: Record<ModelId, string> = ALL_MODELS.reduce((acc, model) => {
  acc[model.id as ModelId] = model.color;
  return acc;
}, {} as Record<ModelId, string>);

export default function EvalDashboard() {
  const [metrics, setMetrics] = useState<EvalMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'feasibility' | 'optimality' | 'clarity' | 'llmJudge'>('feasibility');
  const [hoveredData, setHoveredData] = useState<{ modelId: string; value: number; x: number; y: number; index: number } | null>(null);

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

  const chartData = useMemo(() => {
    if (metrics.length === 0) return { points: {}, modelIds: [], roundLabels: [] };

    const chartHeight = 280;
    const maxValue = 1.0;
    
    const points: Record<string, { x: number; y: number; value: number; index: number }[]> = {};
    const modelIdsWithData = new Set<ModelId>();
    const roundLabels: string[] = metrics.map((_, idx) => `Round ${idx + 1}`);
    
    // First pass: collect all models that have data in the selected metric across all rounds
    metrics.forEach((m) => {
      if (m.metrics && m.metrics[selectedMetric]) {
        Object.entries(m.metrics[selectedMetric]).forEach(([modelId, value]) => {
          if (value !== undefined && value !== null && typeof value === 'number') {
            modelIdsWithData.add(modelId as ModelId);
          }
        });
      }
    });

    // Second pass: build points for all models with data
    Array.from(modelIdsWithData).forEach(modelId => {
      const modelPoints: { x: number; y: number; value: number; index: number }[] = [];
      
      metrics.forEach((m, idx) => {
        if (m.metrics && m.metrics[selectedMetric]) {
          const value = m.metrics[selectedMetric][modelId];
          if (value !== undefined && value !== null && typeof value === 'number') {
            // Calculate X position (0 to 100)
            const x = metrics.length > 1 
              ? (idx / (metrics.length - 1)) * 100 
              : 50; // Center if only one data point
              
            const y = chartHeight - (value / maxValue) * chartHeight;
            
            modelPoints.push({ x, y, value, index: idx });
          }
        }
      });
      
      if (modelPoints.length > 0) {
        points[modelId] = modelPoints;
      }
    });

    return { 
      points, 
      modelIds: Array.from(modelIdsWithData),
      roundLabels 
    };
  }, [metrics, selectedMetric]);

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

  const chartHeight = 280;
  const showDetailedXAxisLabels = metrics.length > 2;

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
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm relative z-0">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">{selectedMetric} Over Time</h2>
            <p className="mt-1 text-sm text-gray-600">Performance trend across {metrics.length} round{metrics.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="relative" style={{ height: `${chartHeight + 40}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 flex h-[280px] flex-col justify-between pr-4 text-right text-xs font-medium text-gray-500 select-none">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Grid lines */}
          <div className="absolute left-12 top-0 w-[calc(100%-48px)] h-[280px] border-l border-b border-gray-200">
            <div className="relative h-full w-full">
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
          <div className="absolute left-12 top-0 h-[280px] w-[calc(100%-48px)]">
            {/* Lines Layer (SVG) */}
            <svg 
              width="100%" 
              height="100%" 
              viewBox={`0 0 100 ${chartHeight}`} 
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {chartData.modelIds.map((modelId) => {
                const points = chartData.points[modelId];
                if (!points || points.length === 0) return null;

                const pathData = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <path
                    key={modelId}
                    d={pathData}
                    fill="none"
                    stroke={MODEL_COLORS[modelId]}
                    strokeWidth="3"
                    opacity="0.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Points Layer (Divs for perfectly circular dots) */}
            {chartData.modelIds.map((modelId) => {
              const points = chartData.points[modelId];
              if (!points) return null;

              return points.map((p, i) => (
                <div
                  key={`${modelId}-${i}`}
                  className="absolute h-3 w-3 -ml-1.5 -mt-1.5 rounded-full cursor-pointer transition-transform hover:scale-150 z-10 hover:z-20 border border-white shadow-sm"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}px`,
                    backgroundColor: MODEL_COLORS[modelId],
                  }}
                  onMouseEnter={() => setHoveredData({ modelId, value: p.value, x: p.x, y: p.y, index: i })}
                  onMouseLeave={() => setHoveredData(null)}
                />
              ));
            })}
            
            {/* Tooltip */}
            {hoveredData && (
              <div
                className="absolute z-50 rounded-lg bg-gray-900/90 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-xs transition-all pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px]"
                style={{
                  left: `${hoveredData.x}%`,
                  top: `${hoveredData.y}px`,
                }}
              >
                <div className="font-bold mb-0.5">{MODEL_NAMES[hoveredData.modelId as ModelId]}</div>
                <div className="flex items-center gap-2">
                  <span>Round {hoveredData.index + 1}:</span>
                  <span className="font-mono text-yellow-300">{(hoveredData.value * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
          
          {/* X-axis labels (Round numbers) */}
          <div className="absolute left-12 top-[290px] w-[calc(100%-48px)] flex justify-between text-xs text-gray-500 font-medium px-2">
            {showDetailedXAxisLabels ? (
              chartData.roundLabels.map((label, index) => (
                <span 
                  key={index} 
                  style={{ left: `${(index / (chartData.roundLabels.length - 1 || 1)) * 100}%` }} 
                  className="absolute -translate-x-1/2"
                >
                  {label}
                </span>
              ))
            ) : (
              <>
                <span>Start</span>
                <span>Latest</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 border-t border-gray-100 pt-6">
          {ALL_MODELS.filter(model => chartData.modelIds.includes(model.id as ModelId)).map((model) => (
            <div key={model.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 border border-gray-100 transition-colors hover:bg-gray-100">
              <div
                className="h-3 w-3 rounded-full shadow-sm ring-1 ring-white"
                style={{ backgroundColor: model.color }}
              />
              <span className="text-xs font-medium text-gray-700 truncate" title={model.name}>
                {model.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Average Performance</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ALL_MODELS.filter(model => chartData.modelIds.includes(model.id as ModelId)).map((model) => {
            const values = metrics
              .map((m) => m.metrics[selectedMetric][model.id])
              .filter((v): v is number => v !== undefined && v !== null);
            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

            return (
              <div
                key={model.id}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 truncate max-w-[100px]" title={model.name}>
                      {model.name}
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
                      backgroundColor: model.color,
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
