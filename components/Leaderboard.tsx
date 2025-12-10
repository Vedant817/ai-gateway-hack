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
    return <div className="text-center">Loading leaderboard...</div>;
  }

  if (!leaderboard) {
    return <div className="text-center text-red-600">Failed to load leaderboard</div>;
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

  return (
    <div className="space-y-4 text-black">
      <h2 className="text-2xl font-bold">Leaderboard</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overall')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overall'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Overall (ELO)
        </button>
        <button
          onClick={() => setActiveTab('feasibility')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'feasibility'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Feasibility
        </button>
        <button
          onClick={() => setActiveTab('optimality')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'optimality'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Optimality
        </button>
        <button
          onClick={() => setActiveTab('clarity')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'clarity'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-black hover:text-black'
          }`}
        >
          Clarity
        </button>
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-right">
                {activeTab === 'overall' ? 'ELO Rating' : 'Best Score'}
              </th>
              <th className="px-4 py-2 text-right">Rounds</th>
              <th className="px-4 py-2 text-right">Wins</th>
              <th className="px-4 py-2 text-right">Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {ratings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-black">
                  No ratings yet. Play a round to see the leaderboard!
                </td>
              </tr>
            ) : (
              ratings.map((rating: ModelRating, index: number) => {
                const displayValue =
                  activeTab === 'overall'
                    ? Math.round(rating.eloRating)
                    : (rating.bestMetric[activeTab] * 100).toFixed(1) + '%';
                
                return (
                  <tr key={rating.modelId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className="text-lg font-bold">#{index + 1}</span>
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {MODEL_NAMES[rating.modelId] || rating.modelId}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{displayValue}</td>
                    <td className="px-4 py-2 text-right text-black">
                      {rating.totalRounds}
                    </td>
                    <td className="px-4 py-2 text-right text-black">
                      {rating.wins}
                    </td>
                    <td className="px-4 py-2 text-right text-black">
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

