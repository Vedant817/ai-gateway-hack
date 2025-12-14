'use client';

import { useState, useEffect } from 'react';
import { Challenge, PuzzleInstance } from '@/types/game';

interface DailyChallengeBannerProps {
  onPlayChallenge: (puzzle: PuzzleInstance) => void;
}

export function DailyChallengeBanner({ onPlayChallenge }: DailyChallengeBannerProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    async function fetchDailyChallenge() {
      try {
        const response = await fetch('/api/challenges/daily');
        if (!response.ok) {
          throw new Error('Failed to fetch daily challenge');
        }
        const data = await response.json();
        setChallenge(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDailyChallenge();
  }, []);

  useEffect(() => {
    if (!challenge) return;

    const calculateTimeLeft = () => {
      const createdAt = new Date(challenge.createdAt).getTime();
      const expiresAt = createdAt + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const difference = expiresAt - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  if (isLoading) {
    return (
      <div className="w-full h-24 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-gray-400">
        Loading Daily Challenge...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
        Error loading daily challenge: {error}
      </div>
    );
  }

  if (!challenge) return null;

  return (
    <div className="relative overflow-hidden bg-linear-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-xl text-white">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-full h-24 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-full h-24 bg-pink-500 opacity-20 rounded-full blur-3xl"></div>
      
      <div className="relative py-2 md:px-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {challenge.name}
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 min-w-[200px]">
          
          <button 
            onClick={() => onPlayChallenge(challenge.puzzle)}
            className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-indigo-600 transition-all duration-200 bg-white rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-transparent w-full md:w-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="mr-2">⚔️</span> Play Now
            <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
