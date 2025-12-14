import { PuzzleInstance, ModelSolution, ScheduledMeeting, ModelId } from '@/types/game';

export function generateMockSolution(modelId: ModelId, puzzle: PuzzleInstance): ModelSolution {
  // Simulate a semi-realistic scheduling attempt
  const scheduledMeetings: ScheduledMeeting[] = [];
  const usedSlots = new Set<string>();

  // Shuffle meetings to simulate different priorities/strategies
  const meetings = [...puzzle.meetings].sort(() => Math.random() - 0.5);

  for (const meeting of meetings) {
    // Try to find a slot
    // This is a very dumb greedy allocator for mock purposes
    const duration = meeting.duration;
    
    // Pick a random participant to anchor the search (e.g. the first required one)
    const anchorId = meeting.requiredParticipants[0];
    const anchor = puzzle.participants.find(p => p.id === anchorId);
    
    if (anchor) {
      // Find a slot in anchor's schedule
      for (const slot of anchor.availableSlots) {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();
        
        if (slotEnd - slotStart >= duration * 60000) {
           // Basic check passed, let's just schedule it if probability allows (simulating failure/success)
           if (Math.random() > 0.2) {
             const meetingStart = new Date(slotStart);
             const meetingEnd = new Date(slotStart + duration * 60000);
             
             scheduledMeetings.push({
               meetingId: meeting.id,
               startTime: meetingStart.toISOString(),
               endTime: meetingEnd.toISOString(),
               participants: [...meeting.requiredParticipants, ...meeting.optionalParticipants.slice(0, 1)]
             });
             break; 
           }
        }
      }
    }
  }

  const rawResponse = JSON.stringify(scheduledMeetings, null, 2);
  
  return {
    modelId,
    rawResponse,
    scheduledMeetings,
    explanation: "This is a MOCK response generated because the AI Gateway returned an error (likely due to missing payment method).",
    parseError: undefined,
  };
}
