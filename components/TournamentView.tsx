'use client';

import { useState, useEffect } from 'react';
import { Tournament } from '@/types/game';
import { TournamentBracket } from './TournamentBracket';

export function TournamentView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  async function fetchTournaments() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tournament/create');
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }
      const data = await response.json();
      setTournaments(data);
      
      // If a tournament is selected, update it
      if (selectedTournament) {
        const updated = data.find((t: Tournament) => t.id === selectedTournament.id);
        if (updated) setSelectedTournament(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function advanceRound() {
    if (!selectedTournament) return;
    setAdvancing(true);
    try {
      const response = await fetch(`/api/tournament/${selectedTournament.id}/advance`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchTournaments();
      } else {
        alert('Failed to advance round');
      }
    } catch (error) {
      console.error('Error advancing round:', error);
      alert('Error advancing round');
    } finally {
      setAdvancing(false);
    }
  }

  if (isLoading && tournaments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Loading Tournaments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
        Error loading tournaments: {error}
      </div>
    );
  }

  if (selectedTournament) {
    const currentRound = selectedTournament.rounds[selectedTournament.currentRound];
    const allMatchesCompleted = currentRound.matches.every(m => m.status === 'completed');
    const isTournamentComplete = selectedTournament.status === 'completed';

    return (
      <div className="space-y-6">
        {/* Tournament Header / Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <button 
            onClick={() => setSelectedTournament(null)} 
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Tournaments
          </button>
          
          <div className="flex items-center gap-3">
             {isTournamentComplete ? (
               <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-bold animate-pulse">
                 <span>🏆</span> Winner: {selectedTournament.winner}
               </div>
             ) : (
                <div className="text-sm font-medium text-gray-500">
                  Status: <span className="text-blue-600">{selectedTournament.status.toUpperCase()}</span>
                </div>
             )}

            {allMatchesCompleted && !isTournamentComplete && (
              <button 
                onClick={advanceRound} 
                disabled={advancing}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50"
              >
                {advancing ? 'Advancing...' : 'Advance to Next Round'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        </div>

        <TournamentBracket tournament={selectedTournament} onTournamentUpdate={fetchTournaments} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900">🏆 Active Tournaments</h2>
        <p className="text-slate-500">Track ongoing championships and view bracket results.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.length > 0 ? (
          tournaments.map(t => (
            <div 
              key={t.id} 
              onClick={() => setSelectedTournament(t)} 
              className="group cursor-pointer bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                  t.status === 'active' ? 'bg-green-100 text-green-700' :
                  t.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {t.status}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                {t.name}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Models Competing:</span>
                  <span className="font-medium text-gray-900">{t.models.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Round:</span>
                  <span className="font-medium text-gray-900">{t.currentRound + 1}</span>
                </div>
                {t.winner && (
                  <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                    <span className="font-bold text-yellow-600">Winner:</span>
                    <span className="font-bold text-gray-900">{t.winner}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
           <div className="col-span-full p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No active tournaments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
