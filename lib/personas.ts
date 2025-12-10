import { PuzzlePersona, PuzzleType, Difficulty } from '@/types/game';

export const PERSONAS: Record<PuzzleType, PuzzlePersona[]> = {
  'meeting-scheduler': [
    {
      id: 'startup-cto',
      name: 'Startup CTO',
      role: 'Chief Technology Officer',
      scenario: 'Scheduling team standups, sprint planning, and code reviews for a fast-growing startup',
      useCase: 'Optimize team coordination while respecting individual availability and time zones',
      icon: '🚀',
    },
    {
      id: 'university-admin',
      name: 'University Administrator',
      role: 'Academic Scheduling Coordinator',
      scenario: 'Creating exam timetables and class schedules for multiple departments',
      useCase: 'Ensure no student or professor has scheduling conflicts across courses',
      icon: '🎓',
    },
    {
      id: 'corporate-pm',
      name: 'Corporate Project Manager',
      role: 'Enterprise Project Manager',
      scenario: 'Coordinating cross-functional meetings for a large organization',
      useCase: 'Balance meeting load, minimize conflicts, and maximize participation',
      icon: '💼',
    },
  ],
  'study-timetable': [
    {
      id: 'student-planner',
      name: 'Student Planner',
      role: 'University Student',
      scenario: 'Creating a weekly study schedule balancing classes, study sessions, and breaks',
      useCase: 'Maximize learning efficiency while preventing burnout',
      icon: '📚',
    },
    {
      id: 'exam-prep',
      name: 'Exam Preparation Coordinator',
      role: 'Study Group Organizer',
      scenario: 'Scheduling group study sessions before final exams',
      useCase: 'Coordinate multiple students with different class schedules',
      icon: '📝',
    },
  ],
  'delivery-routes': [
    {
      id: 'delivery-startup',
      name: 'Delivery Startup Founder',
      role: 'Operations Manager',
      scenario: 'Planning delivery routes for a food delivery service',
      useCase: 'Minimize travel time while respecting delivery windows and vehicle capacity',
      icon: '🚚',
    },
    {
      id: 'logistics-coordinator',
      name: 'Logistics Coordinator',
      role: 'Supply Chain Manager',
      scenario: 'Optimizing warehouse-to-store delivery routes',
      useCase: 'Reduce fuel costs and delivery time while meeting store requirements',
      icon: '📦',
    },
  ],
};

export function getPersonaForPuzzle(type: PuzzleType, difficulty: Difficulty): PuzzlePersona {
  const personas = PERSONAS[type] || PERSONAS['meeting-scheduler'];
  const index = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2;
  return personas[index % personas.length];
}

