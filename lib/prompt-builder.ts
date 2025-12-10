import { PuzzleInstance } from '@/types/game';

export function buildPrompt(puzzle: PuzzleInstance): string {
  const participantsList = puzzle.participants
    .map(
      (p) =>
        `- ${p.name} (ID: ${p.id}): Available slots: ${p.availableSlots.length} slots`
    )
    .join('\n');

  const meetingsList = puzzle.meetings
    .map(
      (m) =>
        `- ${m.name} (ID: ${m.id}): Duration ${m.duration}min, Priority: ${m.priority}, Required: ${m.requiredParticipants.join(', ')}, Optional: ${m.optionalParticipants.join(', ')}`
    )
    .join('\n');

  const constraintsText = `
- Maximum ${puzzle.constraints.maxConcurrentMeetings} concurrent meetings
- Minimum ${puzzle.constraints.minBreakBetweenMeetings} minutes break between meetings
- Maximum ${puzzle.constraints.maxDailyMeetingsPerPerson} meetings per person per day
- Work hours: ${puzzle.constraints.workHours.start} - ${puzzle.constraints.workHours.end}
`;

  const personaContext = puzzle.persona
    ? `\n## Context\nYou are helping ${puzzle.persona.name}, a ${puzzle.persona.role}.\nScenario: ${puzzle.persona.scenario}\nUse Case: ${puzzle.persona.useCase}\n`
    : '';

  return `You are a meeting scheduler. Your task is to schedule all meetings while respecting constraints and optimizing for: ${puzzle.objective}${personaContext}

## Participants and Availability
${participantsList}

For each participant, their available time slots are:
${puzzle.participants
  .map((p) => {
    const slots = p.availableSlots
      .map((s) => {
        const start = new Date(s.start);
        const end = new Date(s.end);
        return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      })
      .join(', ');
    return `${p.name}: ${slots || 'No available slots'}`;
  })
  .join('\n')}

## Meetings to Schedule
${meetingsList}

## Constraints
${constraintsText}

## Output Format
Return a JSON array of scheduled meetings in this exact format:
[
  {
    "meetingId": "meeting-1",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T09:30:00Z",
    "participants": ["participant-1", "participant-2"]
  },
  ...
]

Use ISO 8601 format for dates. The date should be tomorrow (${new Date(Date.now() + 86400000).toISOString().split('T')[0]}).

Important:
- All required participants must be included
- No participant can be double-booked
- All meetings must fit within participant availability
- Prioritize high-priority meetings
- Try to schedule as many meetings as possible
- Balance the meeting load across participants

Provide your solution as a JSON array, then optionally explain your approach.`;
}

