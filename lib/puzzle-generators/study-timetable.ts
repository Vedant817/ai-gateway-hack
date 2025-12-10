import { PuzzleInstance, Participant, Meeting, Difficulty, TimeSlot } from '@/types/game';
import { getPersonaForPuzzle } from '../personas';
import { generateSeed } from '../seed-system';

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

function generateStudents(count: number, date: Date, difficulty: Difficulty): Participant[] {
  const participants: Participant[] = [];
  const names = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn'];
  
  const availabilityRanges: Record<Difficulty, { min: number; max: number }> = {
    easy: { min: 0.6, max: 0.8 },
    medium: { min: 0.4, max: 0.6 },
    hard: { min: 0.2, max: 0.4 },
  };

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
    const range = availabilityRanges[difficulty];
    const availabilityRatio = range.min + Math.random() * (range.max - range.min);
    
    // Students have more flexible hours (8 AM - 10 PM)
    const allSlots = generateTimeSlots(date, 8, 22, 60);
    const availableCount = Math.floor(allSlots.length * availabilityRatio);
    const shuffled = [...allSlots].sort(() => Math.random() - 0.5);
    const availableSlots = shuffled.slice(0, availableCount).sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    participants.push({
      id: `student-${i + 1}`,
      name,
      availableSlots,
      requiredMeetings: [],
      optionalMeetings: [],
    });
  }

  return participants;
}

function generateStudySessions(
  participantCount: number,
  difficulty: Difficulty
): Meeting[] {
  const sessions: Meeting[] = [];
  
  const sessionConfigs: Record<Difficulty, { count: number; minParticipants: number; maxParticipants: number }> = {
    easy: { count: 4, minParticipants: 2, maxParticipants: 3 },
    medium: { count: 6, minParticipants: 2, maxParticipants: 4 },
    hard: { count: 8, minParticipants: 3, maxParticipants: 5 },
  };

  const config = sessionConfigs[difficulty];
  const sessionNames = [
    'Math Review',
    'Chemistry Lab Prep',
    'History Discussion',
    'Physics Problem Set',
    'Literature Analysis',
    'Biology Study Group',
    'Computer Science Coding',
    'Economics Review',
  ];

  const durations = [60, 90, 120]; // minutes
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

  for (let i = 0; i < config.count; i++) {
    const participantCountForSession = 
      config.minParticipants + 
      Math.floor(Math.random() * (config.maxParticipants - config.minParticipants + 1));
    
    const participantIds = Array.from({ length: participantCount }, (_, idx) => `student-${idx + 1}`)
      .sort(() => Math.random() - 0.5)
      .slice(0, participantCountForSession);

    const requiredCount = Math.max(1, Math.floor(participantCountForSession * 0.7));
    const requiredParticipants = participantIds.slice(0, requiredCount);
    const optionalParticipants = participantIds.slice(requiredCount);

    sessions.push({
      id: `session-${i + 1}`,
      name: sessionNames[i % sessionNames.length] + (i >= sessionNames.length ? ` ${Math.floor(i / sessionNames.length) + 1}` : ''),
      duration: durations[Math.floor(Math.random() * durations.length)],
      requiredParticipants,
      optionalParticipants,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
    });
  }

  return sessions;
}

export function generateStudyTimetable(difficulty: Difficulty = 'medium', seed?: string): PuzzleInstance {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  const studentCounts: Record<Difficulty, number> = {
    easy: 3,
    medium: 5,
    hard: 7,
  };

  const students = generateStudents(studentCounts[difficulty], date, difficulty);
  const sessions = generateStudySessions(students.length, difficulty);

  sessions.forEach((session) => {
    session.requiredParticipants.forEach((pid) => {
      const student = students.find((s) => s.id === pid);
      if (student) {
        student.requiredMeetings.push(session.id);
      }
    });
  });

  const constraints = {
    maxConcurrentMeetings: difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4,
    minBreakBetweenMeetings: 30, // Students need longer breaks
    maxDailyMeetingsPerPerson: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7,
    workHours: {
      start: '08:00',
      end: '22:00',
    },
  };

  const objectives = [
    'Maximize study time while preventing burnout',
    'Balance study load across all students',
    'Prioritize high-priority study sessions',
    'Minimize scheduling conflicts for exam prep',
  ];

  const puzzleSeed = seed || generateSeed('study-timetable', difficulty);
  const persona = getPersonaForPuzzle('study-timetable', difficulty);

  return {
    id: `puzzle-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    type: 'study-timetable',
    difficulty,
    participants: students,
    meetings: sessions,
    constraints,
    objective: objectives[Math.floor(Math.random() * objectives.length)],
    createdAt: new Date().toISOString(),
    persona,
    seed: puzzleSeed,
  };
}

