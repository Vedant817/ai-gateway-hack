'use client';

import { Tournament } from '@/types/game';
import { useState } from 'react';

interface TournamentBracketProps {
  tournament: Tournament;
  onTournamentUpdate?: () => void;
}

export function TournamentBracket({ tournament, onTournamentUpdate }: TournamentBracketProps) {
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);

  if (!tournament) return null;

  async function playMatch(matchId: string) {
    if (loadingMatchId) return;
    setLoadingMatchId(matchId);
    try {
      const response = await fetch(`/api/tournament/${tournament.id}/match/${matchId}/play`, {
        method: 'POST',
      });
      if (response.ok) {
        if (onTournamentUpdate) onTournamentUpdate();
      } else {
        alert('Failed to play match');
      }
    } catch (error) {
      console.error('Error playing match:', error);
      alert('Error playing match');
    } finally {
      setLoadingMatchId(null);
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl shadow-inner p-8 overflow-x-auto border border-slate-200">
      <div className="min-w-max">
        <h2 className="text-3xl font-bold mb-8 text-center text-slate-800 tracking-tight">{tournament.name}</h2>
        
        <div className="flex gap-12">
          {tournament.rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="flex flex-col gap-6 min-w-[300px]">
              <div className="text-center pb-4 border-b-2 border-slate-200 mb-2">
                <h3 className="font-bold text-lg text-slate-500 uppercase tracking-wider">
                  {roundIndex === tournament.rounds.length - 1 && round.matches.length === 1 
                    ? 'Championship' 
                    : `Round ${roundIndex + 1}`}
                </h3>
              </div>
              
              <div className="flex flex-col justify-around h-full gap-8">
                {round.matches.map((match, matchIndex) => (
                  <div 
                    key={matchIndex} 
                    className={`relative flex flex-col bg-white rounded-lg shadow-sm border ${
                      match.status === 'completed' ? 'border-slate-300' : 'border-blue-200 ring-1 ring-blue-100'
                    } overflow-hidden transition-all hover:shadow-md`}
                  >
                    {/* Model A */}
                    <div className={`p-3 flex justify-between items-center ${
                      match.winner === match.modelA ? 'bg-green-50' : ''
                    }`}>
                      <span className={`font-medium truncate ${
                        match.winner === match.modelA ? 'text-green-800 font-bold' : 'text-slate-700'
                      }`}>
                        {match.modelA}
                      </span>
                      {match.winner === match.modelA && (
                        <span className="text-green-600 ml-2">✓</span>
                      )}
                    </div>

                    <div className="h-px bg-slate-100 mx-3"></div>

                    {/* Model B */}
                    <div className={`p-3 flex justify-between items-center ${
                      match.winner === match.modelB ? 'bg-green-50' : ''
                    }`}>
                      <span className={`font-medium truncate ${
                        match.winner === match.modelB ? 'text-green-800 font-bold' : match.modelB ? 'text-slate-700' : 'text-slate-400 italic'
                      }`}>
                        {match.modelB || '(Bye)'}
                      </span>
                      {match.winner === match.modelB && (
                        <span className="text-green-600 ml-2">✓</span>
                      )}
                    </div>

                    {/* Action Footer */}
                    {match.status !== 'completed' && match.modelB && (
                      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-center">
                        <button
                          onClick={() => playMatch(match.matchId)}
                          disabled={!!loadingMatchId}
                          className="w-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-3 rounded shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {loadingMatchId === match.matchId ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Simulating...
                            </>
                          ) : (
                            <>
                              <span>▶</span> Play Match
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {match.status === 'completed' && (
                       <div className="absolute top-2 right-2">
                         {/* Optional: Add result visualization indicator */}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
