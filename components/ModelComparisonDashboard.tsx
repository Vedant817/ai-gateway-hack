"use client";

import { useState } from "react";
import { ModelId, ModelComparison } from "@/types/game";

const MODEL_NAMES: Record<string, string> = {
  "grok-code-fast-1": "Grok Code Fast",
  "grok-4-fast-reasoning": "Grok 4 Fast",
  "claude-sonnet-4.5": "Claude Sonnet 4.5",
  "claude-haiku-4.5": "Claude Haiku 4.5",
  "claude-opus-4.5": "Claude Opus 4.5",
  "claude-3.7-sonnet": "Claude 3.7 Sonnet",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini-3-pro-preview": "Gemini 3 Pro Preview",
};

export function ModelComparisonDashboard() {
  const [selectedModels, setSelectedModels] = useState<ModelId[]>([]);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableModels: ModelId[] = [
    "grok-code-fast-1",
    "grok-4-fast-reasoning",
    "claude-sonnet-4.5",
    "claude-haiku-4.5",
    "claude-opus-4.5",
    "claude-3.7-sonnet",
    "gpt-4.1-mini",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-pro-preview",
  ];

  const handleModelSelection = (modelId: ModelId) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId],
    );
  };

  const handleCompare = async () => {
    if (selectedModels.length < 2) {
      alert("Please select at least two models to compare.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analytics/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelIds: selectedModels }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }
      const data = await response.json();
      setComparison(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-slate-800">
      <div className="p-6 border-b border-gray-100 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900">
          📊 Model Comparison Dashboard
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Select models to analyze their head-to-head performance and
          consistency.
        </p>
      </div>

      <div className="p-6">
        {/* Selection Area */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">
              Select Models ({selectedModels.length})
            </h3>
            {selectedModels.length > 0 && (
              <button
                onClick={() => setSelectedModels([])}
                className="text-sm text-red-500 hover:text-red-700 font-medium cursor-pointer hover:underline-offset-2"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {availableModels.map((modelId) => {
              const isSelected = selectedModels.includes(modelId);
              return (
                <div
                  key={modelId}
                  onClick={() => handleModelSelection(modelId)}
                  className={`cursor-pointer p-3 rounded-lg border text-sm font-medium transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    {MODEL_NAMES[modelId] || modelId}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <button
              onClick={handleCompare}
              disabled={isLoading || selectedModels.length < 2}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Compare Models
                </>
              )}
            </button>
            {selectedModels.length < 2 && selectedModels.length > 0 && (
              <span className="ml-3 text-sm text-gray-500">
                Select at least 2 models
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-6">
            Error: {error}
          </div>
        )}

        {comparison && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Metrics Overview */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Comparison Matrix</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-3 text-left font-semibold text-gray-500">
                        Metric
                      </th>
                      {comparison.models.map((id) => (
                        <th
                          key={id}
                          className="px-6 py-3 text-left font-semibold text-gray-900"
                        >
                          {MODEL_NAMES[id] || id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        Win Rate (vs Selected)
                      </td>
                      {comparison.models.map((id) => {
                        const winRate = comparison.metrics[id]?.winRate || 0;
                        return (
                          <td key={id} className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded font-bold ${
                                winRate > 0.6
                                  ? "bg-green-100 text-green-700"
                                  : winRate < 0.4
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {(winRate * 100).toFixed(0)}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        Avg Score
                      </td>
                      {comparison.models.map((id) => (
                        <td key={id} className="px-6 py-4 font-mono">
                          {(
                            (comparison.metrics[id]?.avgScore || 0) * 100
                          ).toFixed(1)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-600">
                        Consistency
                      </td>
                      {comparison.models.map((id) => (
                        <td key={id} className="px-6 py-4 text-gray-600">
                          {(
                            (comparison.metrics[id]?.consistency || 0) * 100
                          ).toFixed(0)}
                          %
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparison.models.map((modelId) => {
                const insight = comparison.insights[modelId];
                if (!insight) return null;
                return (
                  <div
                    key={modelId}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition"
                  >
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                      {MODEL_NAMES[modelId] || modelId}
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                          Strengths
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {insight.strengths.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                          Weaknesses
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {insight.weaknesses.map((w, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-medium"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 border border-gray-100">
                        <span className="font-bold text-gray-900">
                          Verdict:{" "}
                        </span>
                        {insight.summary}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
