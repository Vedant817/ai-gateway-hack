/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChallengeSeed, PuzzleType, Difficulty } from '@/types/game';

export function generateSeed(puzzleType: PuzzleType, difficulty: Difficulty, customConfig?: any): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  const configHash = customConfig ? btoa(JSON.stringify(customConfig)).slice(0, 8) : '';
  return `${puzzleType}-${difficulty}-${timestamp}-${random}${configHash ? '-' + configHash : ''}`;
}

export function parseSeed(seed: string): ChallengeSeed | null {
  try {
    const parts = seed.split('-');
    if (parts.length < 3) return null;

    const type = parts[0] as PuzzleType;
    const difficulty = parts[1] as Difficulty;
    
    let customConfig: any = undefined;
    if (parts.length > 4) {
      try {
        const configBase64 = parts.slice(4).join('-');
        customConfig = JSON.parse(atob(configBase64));
      } catch {
        // Config parsing failed, ignore
      }
    }

    return {
      seed,
      puzzleType: type,
      difficulty,
      customConfig,
    };
  } catch {
    return null;
  }
}

export function validateSeed(seed: string): boolean {
  return parseSeed(seed) !== null;
}

