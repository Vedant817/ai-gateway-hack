/* eslint-disable @typescript-eslint/no-explicit-any */
// API route to get leaderboard

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getRecentRounds } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const leaderboard = await getLeaderboard();
    const recentRounds = await getRecentRounds(10);

    return NextResponse.json({
      success: true,
      leaderboard,
      recentRounds,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

