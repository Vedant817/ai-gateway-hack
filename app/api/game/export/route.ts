/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { exportSolution } from '@/lib/exporters';
import { PuzzleInstance, ModelSolution } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puzzle, solution, format = 'json' } = body as {
      puzzle: PuzzleInstance;
      solution: ModelSolution;
      format?: 'json' | 'csv' | 'calendar';
    };

    if (!puzzle || !solution) {
      return NextResponse.json(
        { success: false, error: 'Puzzle and solution are required' },
        { status: 400 }
      );
    }

    const exported = exportSolution(puzzle, solution, format);

    // Set appropriate content type and filename
    const contentTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      calendar: 'text/calendar',
    };

    const extensions: Record<string, string> = {
      json: 'json',
      csv: 'csv',
      calendar: 'ics',
    };

    const filename = `solution-${puzzle.id}-${solution.modelId}.${extensions[format]}`;

    return new NextResponse(exported, {
      headers: {
        'Content-Type': contentTypes[format],
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting solution:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export solution' },
      { status: 500 }
    );
  }
}

