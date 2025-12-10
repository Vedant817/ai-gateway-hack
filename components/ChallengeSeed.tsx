'use client';

import { useState } from 'react';
import { PuzzleInstance } from '@/types/game';

interface ChallengeSeedProps {
  puzzle: PuzzleInstance;
  onLoadSeed?: (seed: string) => void;
}

export default function ChallengeSeed({ puzzle, onLoadSeed }: ChallengeSeedProps) {
  const [seedInput, setSeedInput] = useState('');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (puzzle.seed) {
      navigator.clipboard.writeText(puzzle.seed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleLoad() {
    if (seedInput.trim() && onLoadSeed) {
      onLoadSeed(seedInput.trim());
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4 text-black">
      <h3 className="font-semibold">Challenge Seed</h3>
      <p className="text-sm text-black">
        Share this puzzle with others using the seed, or load a specific challenge
      </p>

      {puzzle.seed && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={puzzle.seed}
              readOnly
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleCopy}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Load Challenge by Seed</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            placeholder="Paste challenge seed here"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleLoad}
            disabled={!seedInput.trim()}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
}

