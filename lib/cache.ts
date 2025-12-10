/* eslint-disable @typescript-eslint/no-explicit-any */
import { kvSet, kvGet } from './kv-client';
import crypto from 'crypto';

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const CACHE_PREFIX = 'puzzle-cache:';

function hashPuzzle(puzzleKey: string): string {
  return crypto.createHash('sha256').update(puzzleKey).digest('hex');
}

export function cacheKeyFromPuzzle(puzzle: any): string {
  // Create a deterministic hash of puzzle structure
  const payload = JSON.stringify({
    type: puzzle.type,
    difficulty: puzzle.difficulty,
    objective: puzzle.objective,
    participants: puzzle.participants?.map((p: any) => ({
      avail: p.availableSlots?.length,
      req: p.requiredMeetings?.length,
    })),
    meetings: puzzle.meetings?.map((m: any) => ({
      duration: m.duration,
      req: m.requiredParticipants?.length,
      opt: m.optionalParticipants?.length,
      priority: m.priority,
    })),
    constraints: puzzle.constraints,
  });
  return hashPuzzle(payload);
}

export async function getCachedSolution(puzzle: any): Promise<any> {
  const key = cacheKeyFromPuzzle(puzzle);
  const cached = await kvGet(`${CACHE_PREFIX}${key}`);
  return cached?.data || null;
}

export async function setCachedSolution(puzzle: any, data: any): Promise<void> {
  const key = cacheKeyFromPuzzle(puzzle);
  await kvSet(`${CACHE_PREFIX}${key}`, { data, timestamp: Date.now() }, CACHE_TTL_SECONDS);
}

