// Puzzle generator for Meeting Scheduler Arena

import { PuzzleInstance, Participant, Meeting, Difficulty, TimeSlot, PuzzleType } from '@/types/game';
import { getPersonaForPuzzle } from './personas';
import { generateSeed, parseSeed } from './seed-system';

function generateTimeSlots(
  date: Date,
  startHour: number,
  endHour: number,
  slotDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = new Date(date);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(endHour, 0, 0, 0);

  let current = new Date(start);
  while (current < end) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
    if (slotEnd <= end) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
      });
    }
    current = new Date(slotEnd);
  }
  return slots;
}

function generateParticipants(count: number, date: Date, difficulty: Difficulty): Participant[] {
  const participants: Participant[] = [];
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  
  // Difficulty affects availability
  const availabilityRanges: Record<Difficulty, { min: number; max: number }> = {
    easy: { min: 0.7, max: 0.9 }, // 70-90% availability
    medium: { min: 0.5, max: 0.7 }, // 50-70% availability
    hard: { min: 0.3, max: 0.5 }, // 30-50% availability
  };

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
    const range = availabilityRanges[difficulty];
    const availabilityRatio = range.min + Math.random() * (range.max - range.min);
    
    // Generate available slots (work hours 9 AM - 5 PM)
    const allSlots = generateTimeSlots(date, 9, 17, 30);
    const availableCount = Math.floor(allSlots.length * availabilityRatio);
    const shuffled = [...allSlots].sort(() => Math.random() - 0.5);
    const availableSlots = shuffled.slice(0, availableCount).sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    participants.push({
      id: `participant-${i + 1}`,
      name,
      availableSlots,
      requiredMeetings: [],
      optionalMeetings: [],
    });
  }

  return participants;
}

function generateMeetings(
  participantCount: number,
  difficulty: Difficulty
): Meeting[] {
  const meetings: Meeting[] = [];
  
  const meetingConfigs: Record<Difficulty, { count: number; minParticipants: number; maxParticipants: number }> = {
    easy: { count: 5, minParticipants: 2, maxParticipants: 3 },
    medium: { count: 8, minParticipants: 2, maxParticipants: 4 },
    hard: { count: 12, minParticipants: 3, maxParticipants: 5 },
  };

  const config = meetingConfigs[difficulty];
  const meetingNames = [
    'Standup',
    'Design Review',
    'Sprint Planning',
    'Retrospective',
    'Client Call',
    'Architecture Discussion',
    'Code Review',
    'Team Sync',
    'Product Demo',
    'Strategy Session',
    'Training',
    'One-on-One',
  ];

  const durations = [30, 45, 60]; // minutes
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

  for (let i = 0; i < config.count; i++) {
    const participantCountForMeeting = 
      config.minParticipants + 
      Math.floor(Math.random() * (config.maxParticipants - config.minParticipants + 1));
    
    const participantIds = Array.from({ length: participantCount }, (_, idx) => `participant-${idx + 1}`)
      .sort(() => Math.random() - 0.5)
      .slice(0, participantCountForMeeting);

    const requiredCount = Math.max(1, Math.floor(participantCountForMeeting * 0.6));
    const requiredParticipants = participantIds.slice(0, requiredCount);
    const optionalParticipants = participantIds.slice(requiredCount);

    meetings.push({
      id: `meeting-${i + 1}`,
      name: meetingNames[i % meetingNames.length] + (i >= meetingNames.length ? ` ${Math.floor(i / meetingNames.length) + 1}` : ''),
      duration: durations[Math.floor(Math.random() * durations.length)],
      requiredParticipants,
      optionalParticipants,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
    });
  }

  return meetings;
}

export function generatePuzzle(difficulty: Difficulty = 'medium', seed?: string): PuzzleInstance {
  const date = new Date();
  date.setDate(date.getDate() + 1); // Tomorrow
  date.setHours(0, 0, 0, 0);

  const participantCounts: Record<Difficulty, number> = {
    easy: 4,
    medium: 6,
    hard: 8,
  };

  const participants = generateParticipants(participantCounts[difficulty], date, difficulty);
  const meetings = generateMeetings(participants.length, difficulty);

  // Assign required/optional meetings to participants
  meetings.forEach((meeting) => {
    meeting.requiredParticipants.forEach((pid) => {
      const participant = participants.find((p) => p.id === pid);
      if (participant) {
        participant.requiredMeetings.push(meeting.id);
      }
    });
    meeting.optionalParticipants.forEach((pid) => {
      const participant = participants.find((p) => p.id === pid);
      if (participant) {
        participant.optionalMeetings.push(meeting.id);
      }
    });
  });

  const constraints = {
    maxConcurrentMeetings: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4,
    minBreakBetweenMeetings: 15,
    maxDailyMeetingsPerPerson: difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8,
    workHours: {
      start: '09:00',
      end: '17:00',
    },
  };

  const objectives = [
    'Minimize scheduling conflicts',
    'Maximize participant availability utilization',
    'Prioritize high-priority meetings',
    'Balance meeting load across participants',
  ];

  return {
    id: `puzzle-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: 'meeting-scheduler',
    difficulty,
    participants,
    meetings,
    constraints,
    objective: objectives[Math.floor(Math.random() * objectives.length)],
    createdAt: new Date().toISOString(),
  };
}

