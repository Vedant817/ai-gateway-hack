import { PuzzleInstance, Difficulty, PuzzleType } from '@/types/game';
import { generatePuzzle } from './puzzle-generator';
import { generateStudyTimetable } from './puzzle-generators/study-timetable';
import { parseSeed } from './seed-system';

export function createPuzzle(
  type: PuzzleType,
  difficulty: Difficulty = 'medium',
  seed?: string
): PuzzleInstance {
  if (seed) {
    const parsed = parseSeed(seed);
    if (parsed) {
      type = parsed.puzzleType;
      difficulty = parsed.difficulty;
    }
  }

  switch (type) {
    case 'meeting-scheduler':
      return generatePuzzle(difficulty, seed);
    case 'study-timetable':
      return generateStudyTimetable(difficulty, seed);
    default:
      return generatePuzzle(difficulty, seed);
  }
}

