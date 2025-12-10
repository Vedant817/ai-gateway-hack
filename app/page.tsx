/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { PuzzleInstance, Difficulty, ModelId, ModelSolution, SolutionScore, PuzzleType, RoundResult } from '@/types/game';
import GameRace from '@/components/GameRace';
import ResultsPodium from '@/components/ResultsPodium';
import PuzzleInfo from '@/components/PuzzleInfo';
import Leaderboard from '@/components/Leaderboard';
import ExportButton from '@/components/ExportButton';
import HumanRating from '@/components/HumanRating';
import ReplayView from '@/components/ReplayView';
import EvalDashboard from '@/components/EvalDashboard';

type GameState = 'idle' | 'loading' | 'racing' | 'results';
type ViewMode = 'game' | 'leaderboard' | 'dashboard';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('game');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('meeting-scheduler');
  const [puzzle, setPuzzle] = useState<PuzzleInstance | null>(null);
  const [solutions, setSolutions] = useState<ModelSolution[]>([]);
  const [scores, setScores] = useState<SolutionScore[]>([]);
  const [winner, setWinner] = useState<ModelId | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showReplay, setShowReplay] = useState(false);

  async function startGame(seed?: string) {
    try {
      setGameState('loading');
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, puzzleType, seed }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to start game');
      }

      setPuzzle(data.puzzle);
      setGameState('racing');
      setSolutions([]);
      setScores([]);
      setWinner(null);
      setRoundResult(null);
      setShowReplay(false);
    } catch (error: any) {
      alert('Error starting game: ' + error.message);
      setGameState('idle');
    }
  }

  async function handleRaceComplete(
    newSolutions: ModelSolution[],
    newScores: SolutionScore[],
    newWinner: ModelId
  ) {
    setSolutions(newSolutions);
    setScores(newScores);
    setWinner(newWinner);
    setGameState('results');

    // Save round result
    if (puzzle) {
      try {
        const roundResponse = await fetch('/api/game/round', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puzzle,
            solutions: newSolutions,
            scores: newScores,
            winner: newWinner,
          }),
        });

        const roundData = await roundResponse.json();
        if (roundData.success && puzzle) {
          setRoundResult({
            roundId: roundData.roundId,
            puzzle,
            solutions: newSolutions,
            scores: newScores,
            winner: newWinner,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error saving round:', error);
      }
    }
  }

  function resetGame() {
    setGameState('idle');
    setPuzzle(null);
    setSolutions([]);
    setScores([]);
    setWinner(null);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-black">
            🏛️ Constraint Coliseum
          </h1>
          <p className="text-lg text-black">
            AI Planner Arena - Watch models compete to solve constraint puzzles
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setViewMode('game')}
              className={`rounded px-4 py-2 font-medium ${
                viewMode === 'game'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              Game
            </button>
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`rounded px-4 py-2 font-medium ${
                viewMode === 'leaderboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setViewMode('dashboard')}
              className={`rounded px-4 py-2 font-medium ${
                viewMode === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              Eval Dashboard
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content based on view mode */}
          {viewMode === 'dashboard' ? (
            <div className="lg:col-span-3">
              <EvalDashboard />
            </div>
          ) : viewMode === 'leaderboard' ? (
            <div className="lg:col-span-3">
              <Leaderboard />
            </div>
          ) : (
            <>
              {/* Left column - Game controls and puzzle info */}
              <div className="lg:col-span-1 space-y-4">
                {gameState === 'idle' && (
                  <div className="rounded-lg border bg-white p-6 shadow-sm text-black">
                    <h2 className="mb-4 text-xl font-semibold">Start New Round</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Puzzle Type
                        </label>
                        <select
                          value={puzzleType}
                          onChange={(e) => setPuzzleType(e.target.value as PuzzleType)}
                          className="w-full rounded border border-gray-300 px-3 py-2"
                        >
                          <option value="meeting-scheduler">Meeting Scheduler</option>
                          <option value="study-timetable">Study Timetable</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                          className="w-full rounded border border-gray-300 px-3 py-2"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <button
                        onClick={() => startGame()}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                      >
                        Start Round
                      </button>
                    </div>
                  </div>
                )}

                {puzzle && <PuzzleInfo puzzle={puzzle} />}

                {/* {puzzle && <ChallengeSeed puzzle={puzzle} onLoadSeed={(seed) => startGame(seed)} />} */}

                {gameState === 'results' && winner && solutions.length > 0 && puzzle && (
                  <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4 text-black">
                    <ExportButton
                      puzzle={puzzle}
                      solution={solutions.find((s) => s.modelId === winner)!}
                    />
                    {/* <button
                      onClick={() => setShowReplay(!showReplay)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-black hover:bg-gray-50"
                    >
                      {showReplay ? 'Hide' : 'Show'} Replay View
                    </button> */}
                    <button
                      onClick={resetGame}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      New Round
                    </button>
                  </div>
                )}
              </div>

              {/* Center column - Game race and results */}
          <div className="lg:col-span-2 space-y-4">
            {gameState === 'idle' && (
              <div className="rounded-lg border bg-white p-12 text-center shadow-sm text-black">
                <p className="text-black">
                  Select a difficulty and click &quot;Start Round&quot; to begin!
                </p>
              </div>
            )}

            {gameState === 'loading' && (
              <div className="rounded-lg border bg-white p-12 text-center shadow-sm text-black">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-black">Generating puzzle...</p>
              </div>
            )}

            {gameState === 'racing' && puzzle && (
              <div className="rounded-lg border bg-white p-6 shadow-sm text-black">
                <GameRace puzzle={puzzle} onComplete={handleRaceComplete} />
              </div>
            )}

            {gameState === 'results' && scores.length > 0 && winner && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-white p-6 shadow-sm text-black">
                  <ResultsPodium scores={scores} winner={winner} />
                </div>
                <HumanRating
                  roundId={roundResult?.roundId || ''}
                  scores={scores}
                />
                {showReplay && roundResult && (
                  <div className="rounded-lg border bg-white p-6 shadow-sm text-black">
                    <ReplayView roundResult={roundResult} />
                  </div>
                )}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
