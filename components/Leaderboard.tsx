/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ModelRating } from '@/types/game';

const MODEL_NAMES: Record<string, string> = {
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

const METRIC_DESCRIPTIONS = {
  overall: 'Global ranking based on competitive performance (ELO system). Higher is better.',
  feasibility: 'Ability to satisfy hard constraints (e.g., no double bookings, meeting requirements).',
  optimality: 'Quality of the solution beyond constraints (e.g., balance, distribution).',
  clarity: 'Quality of the output format and explanation.',
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overall' | 'feasibility' | 'optimality' | 'clarity'>('overall');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Updating leaderboard...</span>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100 text-red-600">
        Failed to load leaderboard data. Please try again later.
      </div>
    );
  }

  const getRatings = () => {
    switch (activeTab) {
      case 'feasibility':
        return leaderboard.byMetric.feasibility;
      case 'optimality':
        return leaderboard.byMetric.optimality;
      case 'clarity':
        return leaderboard.byMetric.clarity;
      default:
        return leaderboard.overall;
    }
  };

  const ratings = getRatings();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <span className="text-2xl" role="img" aria-label="Gold Medal">🥇</span>;
      case 1: return <span className="text-2xl" role="img" aria-label="Silver Medal">🥈</span>;
      case 2: return <span className="text-2xl" role="img" aria-label="Bronze Medal">🥉</span>;
      default: return <span className="text-gray-400 font-mono font-bold">#{index + 1}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-slate-800">
      <div className="p-6 border-b border-gray-100 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          🏆 Leaderboard
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Real-time performance rankings across all models
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
        {(['overall', 'feasibility', 'optimality', 'clarity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100">
        <p className="text-sm text-blue-700 flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {METRIC_DESCRIPTIONS[activeTab]}
        </p>
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3 text-left font-semibold">Rank</th>
              <th className="px-6 py-3 text-left font-semibold">Model</th>
              <th className="px-6 py-3 text-right font-semibold">
                {activeTab === 'overall' ? 'ELO Rating' : 'Best Score'}
              </th>
              <th className="px-6 py-3 text-right font-semibold hidden sm:table-cell">Rounds</th>
              <th className="px-6 py-3 text-right font-semibold hidden md:table-cell">Wins</th>
              <th className="px-6 py-3 text-right font-semibold hidden sm:table-cell">Avg Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ratings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🏁</span>
                    <p>No ratings yet. Start a race to populate the leaderboard!</p>
                  </div>
                </td>
              </tr>
            ) : (
              ratings.map((rating: ModelRating, index: number) => {
                const displayValue =
                  activeTab === 'overall'
                    ? Math.round(rating.eloRating)
                    : (rating.bestMetric[activeTab] * 100).toFixed(1) + '%';
                
                return (
                  <tr 
                    key={rating.modelId} 
                    className={`group transition-colors hover:bg-blue-50/30 ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 w-8 justify-center">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {MODEL_NAMES[rating.modelId] || rating.modelId}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5 md:hidden">
                        {rating.modelId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-bold ${
                        activeTab === 'overall' 
                          ? 'bg-slate-100 text-slate-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {displayValue}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 hidden sm:table-cell">
                      {rating.totalRounds}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 hidden md:table-cell">
                      {rating.wins}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 hidden sm:table-cell">
                      {(rating.averageScore * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

