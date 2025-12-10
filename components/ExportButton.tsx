'use client';

import { useState } from 'react';
import { PuzzleInstance, ModelSolution } from '@/types/game';

interface ExportButtonProps {
  puzzle: PuzzleInstance;
  solution: ModelSolution;
}

export default function ExportButton({ puzzle, solution }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: 'json' | 'csv' | 'calendar') {
    try {
      setExporting(true);
      const response = await fetch('/api/game/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzle, solution, format }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solution-${puzzle.id}-${solution.modelId}.${format === 'calendar' ? 'ics' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export solution');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-black">Export Solution</div>
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('json')}
          disabled={exporting}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'JSON'}
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={exporting}
          className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          CSV
        </button>
        <button
          onClick={() => handleExport('calendar')}
          disabled={exporting}
          className="rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Calendar
        </button>
      </div>
      <p className="text-xs text-black">
        Download the winning solution for use in real applications
      </p>
    </div>
  );
}

