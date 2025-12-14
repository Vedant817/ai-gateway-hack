import { NextResponse } from 'next/server';
import { getDailyChallenge, saveChallenge } from '@/lib/storage';
import { generatePuzzle } from '@/lib/puzzle-generator';
import { Challenge, PuzzleInstance } from '@/types/game';
import { customAlphabet } from 'nanoid';
import { generateText } from 'ai';
import { modelMap } from '@/lib/ai-gateway';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10);
const shareId = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export async function GET() {
  try {
    let dailyChallenge = await getDailyChallenge();

    if (!dailyChallenge) {
      console.log('Generating new daily challenge via LLM...');
      let generatedData: { name: string; description: string; puzzle: PuzzleInstance } | null = null;

      try {
        const prompt = `
          You are an expert puzzle generator for a logic game called "Constraint Coliseum".
          Generate a unique, challenging, and interesting "meeting-scheduler" puzzle for today's Daily Challenge.
          
          The output must be a valid JSON object with the following structure:
          {
            "name": "A creative title for the challenge (e.g., 'The CEO's Nightmare', 'Holiday Rush')",
            "description": "A short, engaging description of the scenario",
            "puzzle": { ... valid PuzzleInstance object ... }
          }

          Here are the TypeScript interfaces for the puzzle structure. Ensure the JSON strictly adheres to this:

          type Difficulty = 'easy' | 'medium' | 'hard';
          type PuzzleType = 'meeting-scheduler';

          interface TimeSlot {
            start: string; // ISO datetime string (e.g., "2023-10-27T09:00:00.000Z")
            end: string;   // ISO datetime string
          }

          interface Participant {
            id: string;
            name: string;
            availableSlots: TimeSlot[]; // Random chunks of time they are free
            requiredMeetings: string[]; // IDs of meetings they must attend (leave empty, will be inferred or fill if you want specific constraints)
            optionalMeetings: string[]; // IDs of meetings they can attend
          }

          interface Meeting {
            id: string;
            name: string;
            duration: number; // minutes (e.g., 30, 60, 45)
            requiredParticipants: string[]; // Participant IDs
            optionalParticipants: string[]; // Participant IDs
            priority: 'high' | 'medium' | 'low';
          }

          interface PuzzleInstance {
            id: string; // generate a random string
            type: 'meeting-scheduler';
            difficulty: Difficulty;
            participants: Participant[];
            meetings: Meeting[];
            constraints: {
              maxConcurrentMeetings: number;
              minBreakBetweenMeetings: number; // e.g., 15
              maxDailyMeetingsPerPerson: number;
              workHours: { start: string; end: string }; // e.g., "09:00", "17:00"
            };
            objective: string;
            createdAt: string; // ISO string
          }
          
          Requirements:
          1. Use specific, thematic names for participants and meetings based on the Challenge Name you choose (e.g., if it's "Startup Crunch", use "Investor Pitch", "Product Launch").
          2. Ensure dates are for tomorrow.
          3. Generate 4-6 participants and 4-6 meetings.
          4. Ensure the puzzle is solvable but requires logic.
          5. RETURN ONLY JSON. NO MARKDOWN.
        `;

        const { text } = await generateText({
          model: modelMap['gemini-2.5-flash'],
          prompt: prompt,
          temperature: 0.8,
        });

        // Clean up markdown code blocks if present
        const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
        generatedData = JSON.parse(jsonString);

      } catch (llmError) {
        console.error('LLM Generation failed, falling back to algorithmic generation:', llmError);
      }

      const puzzle = generatedData?.puzzle || generatePuzzle('medium');
      const name = generatedData?.name || 'Daily Challenge';
      const description = generatedData?.description || `Today's daily challenge! Solve the puzzle and see how you rank.`;

      const newChallenge: Challenge = {
        id: nanoid(),
        shareCode: shareId(),
        name: name,
        description: description,
        puzzle,
        createdBy: 'system',
        submissions: [],
        votes: 0,
        category: 'daily',
        createdAt: new Date().toISOString(),
      };

      await saveChallenge(newChallenge);
      dailyChallenge = newChallenge;
    }

    return NextResponse.json(dailyChallenge);
  } catch (error) {
    console.error('Failed to retrieve daily challenge:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
