import {
  PuzzleInstance,
  ModelSolution,
  SolutionScore,
  ConstraintViolation,
  ScheduledMeeting,
  TimeSlot,
} from '@/types/game';

function parseSolution(rawResponse: string): ScheduledMeeting[] {
  try {
    const startIdx = rawResponse.indexOf('[');
    if (startIdx !== -1) {
      let bracketCount = 0;
      let endIdx = -1;
      let inString = false;
      let escapeNext = false;
      for (let i = startIdx; i < rawResponse.length; i++) {
        const char = rawResponse[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '[' || char === '{') {
            bracketCount++;
          } else if (char === ']' || char === '}') {
            bracketCount--;
            if (bracketCount === 0 && char === ']') {
              endIdx = i;
              break;
            }
          }
        }
      }
      if (endIdx !== -1) {
        const jsonStr = rawResponse.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            meetingId: item.meetingId || item.meeting_id || item.id,
            startTime: item.startTime || item.start_time || item.start,
            endTime: item.endTime || item.end_time || item.end,
            participants: item.participants || item.participant_ids || [],
          }));
        }
      }
    }

    const meetings: ScheduledMeeting[] = [];
    const meetingPattern = /meeting[:\s]+([^\n,]+)[,\s]+(?:start|from)[:\s]+([^\n,]+)[,\s]+(?:end|to)[:\s]+([^\n,]+)/gi;
    let match;
    while ((match = meetingPattern.exec(rawResponse)) !== null) {
      meetings.push({
        meetingId: match[1].trim(),
        startTime: match[2].trim(),
        endTime: match[3].trim(),
        participants: [],
      });
    }

    return meetings;
  } catch (error) {
    return [];
  }
}

function timeOverlaps(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = new Date(slot1.start).getTime();
  const end1 = new Date(slot1.end).getTime();
  const start2 = new Date(slot2.start).getTime();
  const end2 = new Date(slot2.end).getTime();
  return start1 < end2 && start2 < end1;
}

function validateConstraints(
  puzzle: PuzzleInstance,
  scheduled: ScheduledMeeting[]
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const meetingMap = new Map(puzzle.meetings.map((m) => [m.id, m]));
  const participantMap = new Map(puzzle.participants.map((p) => [p.id, p]));

  const participantSchedules = new Map<string, ScheduledMeeting[]>();
  const meetingCounts = new Map<string, number>();

  const timeSlots: Array<{ time: TimeSlot; meetings: ScheduledMeeting[] }> = [];

  for (const scheduledMeeting of scheduled) {
    const meeting = meetingMap.get(scheduledMeeting.meetingId);
    if (!meeting) {
      violations.push({
        type: 'missing-meeting',
        severity: 'critical',
        description: `Meeting ${scheduledMeeting.meetingId} not found in puzzle`,
        affectedMeetings: [scheduledMeeting.meetingId],
      });
      continue;
    }

    const missingRequired = meeting.requiredParticipants.filter(
      (pid) => !scheduledMeeting.participants.includes(pid)
    );
    if (missingRequired.length > 0) {
      violations.push({
        type: 'missing-participant',
        severity: 'critical',
        description: `Meeting ${scheduledMeeting.meetingId} missing required participants: ${missingRequired.join(', ')}`,
        affectedMeetings: [scheduledMeeting.meetingId],
        affectedParticipants: missingRequired,
      });
    }

    const startTime = new Date(scheduledMeeting.startTime);
    const endTime = new Date(scheduledMeeting.endTime);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    for (const participantId of scheduledMeeting.participants) {
      const participant = participantMap.get(participantId);
      if (!participant) continue;

      const isAvailable = participant.availableSlots.some((slot) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        return startTime >= slotStart && endTime <= slotEnd;
      });

      if (!isAvailable) {
        violations.push({
          type: 'outside-hours',
          severity: 'critical',
          description: `Participant ${participantId} not available for meeting ${scheduledMeeting.meetingId}`,
          affectedMeetings: [scheduledMeeting.meetingId],
          affectedParticipants: [participantId],
        });
      }

      if (!participantSchedules.has(participantId)) {
        participantSchedules.set(participantId, []);
      }
      participantSchedules.get(participantId)!.push(scheduledMeeting);

      meetingCounts.set(participantId, (meetingCounts.get(participantId) || 0) + 1);
    }

    if (Math.abs(duration - meeting.duration) > 5) {
      violations.push({
        type: 'overlap',
        severity: 'warning',
        description: `Meeting ${scheduledMeeting.meetingId} duration mismatch (expected ${meeting.duration}min, got ${duration}min)`,
        affectedMeetings: [scheduledMeeting.meetingId],
      });
    }

    timeSlots.push({
      time: { start: scheduledMeeting.startTime, end: scheduledMeeting.endTime },
      meetings: [scheduledMeeting],
    });
  }

  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      if (timeOverlaps(timeSlots[i].time, timeSlots[j].time)) {
        const commonParticipants = timeSlots[i].meetings[0].participants.filter((p) =>
          timeSlots[j].meetings[0].participants.includes(p)
        );
        if (commonParticipants.length > 0) {
          violations.push({
            type: 'double-booking',
            severity: 'critical',
            description: `Participant(s) ${commonParticipants.join(', ')} double-booked`,
            affectedMeetings: [
              timeSlots[i].meetings[0].meetingId,
              timeSlots[j].meetings[0].meetingId,
            ],
            affectedParticipants: commonParticipants,
          });
        }
      }
    }
  }

  for (const [participantId, meetings] of participantSchedules.entries()) {
    const sorted = [...meetings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const endTime = new Date(sorted[i].endTime).getTime();
      const nextStartTime = new Date(sorted[i + 1].startTime).getTime();
      const breakMinutes = (nextStartTime - endTime) / (1000 * 60);
      if (breakMinutes < puzzle.constraints.minBreakBetweenMeetings) {
        violations.push({
          type: 'insufficient-break',
          severity: 'warning',
          description: `Participant ${participantId} has insufficient break (${breakMinutes}min) between meetings`,
          affectedMeetings: [sorted[i].meetingId, sorted[i + 1].meetingId],
          affectedParticipants: [participantId],
        });
      }
    }
  }

  for (const [participantId, count] of meetingCounts.entries()) {
    if (count > puzzle.constraints.maxDailyMeetingsPerPerson) {
      violations.push({
        type: 'too-many-daily',
        severity: 'warning',
        description: `Participant ${participantId} exceeds max daily meetings (${count} > ${puzzle.constraints.maxDailyMeetingsPerPerson})`,
        affectedParticipants: [participantId],
      });
    }
  }

  const scheduledMeetingIds = new Set(scheduled.map((m) => m.meetingId));
  for (const meeting of puzzle.meetings) {
    if (meeting.priority === 'high' && !scheduledMeetingIds.has(meeting.id)) {
      violations.push({
        type: 'missing-meeting',
        severity: 'critical',
        description: `High-priority meeting ${meeting.id} not scheduled`,
        affectedMeetings: [meeting.id],
      });
    }
  }

  return violations;
}

function calculateOptimalityScore(
  puzzle: PuzzleInstance,
  scheduled: ScheduledMeeting[]
): number {
  if (scheduled.length === 0) return 0;

  let score = 0;
  const maxScore = 100;

  const scheduledCount = scheduled.length;
  const totalMeetings = puzzle.meetings.length;
  score += (scheduledCount / totalMeetings) * 30;

  const highPriorityScheduled = scheduled.filter((s) => {
    const meeting = puzzle.meetings.find((m) => m.id === s.meetingId);
    return meeting?.priority === 'high';
  }).length;
  const highPriorityTotal = puzzle.meetings.filter((m) => m.priority === 'high').length;
  if (highPriorityTotal > 0) {
    score += (highPriorityScheduled / highPriorityTotal) * 30;
  }

  const participantLoads = new Map<string, number>();
  for (const s of scheduled) {
    for (const pid of s.participants) {
      participantLoads.set(pid, (participantLoads.get(pid) || 0) + 1);
    }
  }
  if (participantLoads.size > 0) {
    const loads = Array.from(participantLoads.values());
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
    const maxVariance = Math.pow(avgLoad, 2); // Theoretical max variance
    const balanceScore = Math.max(0, 1 - variance / maxVariance);
    score += balanceScore * 20;

    // Reward compact scheduling (minimize gaps)
    const allTimes = scheduled.flatMap((s) => [
      new Date(s.startTime).getTime(),
      new Date(s.endTime).getTime(),
    ]);
    if (allTimes.length > 0) {
      const minTime = Math.min(...allTimes);
      const maxTime = Math.max(...allTimes);
      const totalSpan = maxTime - minTime;
      const meetingTime = scheduled.reduce(
        (sum, s) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()),
        0
      );
      const compactness = meetingTime / totalSpan;
      score += compactness * 20;
    }
  }

  return Math.min(100, score) / 100;
}

function calculateClarityScore(solution: ModelSolution): number {
  let score = 0;

  // Check if solution was parseable
  if (solution.parseError) {
    return 0.1; // Minimal score for unparseable
  }

  if (solution.scheduledMeetings.length > 0) {
    score += 0.5; // Successfully parsed
  }

  // Check if output follows structure
  const hasStructure = solution.rawResponse.includes('{') || solution.rawResponse.includes('[');
  if (hasStructure) {
    score += 0.2;
  }

  // Check for explanation
  if (solution.explanation && solution.explanation.length > 20) {
    score += 0.2;
  }

  // Penalize overly verbose responses
  const responseLength = solution.rawResponse.length;
  if (responseLength > 5000) {
    score -= 0.1;
  } else if (responseLength < 100 && solution.scheduledMeetings.length === 0) {
    score -= 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

export function validateAndScore(
  puzzle: PuzzleInstance,
  solution: ModelSolution
): SolutionScore {
  const scheduled = solution.scheduledMeetings.length > 0
    ? solution.scheduledMeetings
    : parseSolution(solution.rawResponse);

  const violations = validateConstraints(puzzle, scheduled);
  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const warningViolations = violations.filter((v) => v.severity === 'warning');

  // Feasibility: proportion of hard constraints satisfied
  const totalConstraints = puzzle.meetings.length + puzzle.participants.length; // Approximate number of constraints
  const violatedConstraints = criticalViolations.length;
  const feasibility = Math.max(0, 1 - violatedConstraints / Math.max(1, totalConstraints));

  // Optimality: how good the solution is
  const optimality = calculateOptimalityScore(puzzle, scheduled);

  // Clarity: output quality
  const clarity = calculateClarityScore({
    ...solution,
    scheduledMeetings: scheduled,
  });

  // Weighted total score
  const totalScore = feasibility * 0.5 + optimality * 0.3 + clarity * 0.2;

  return {
    modelId: solution.modelId,
    feasibility,
    optimality,
    clarity,
    violations,
    totalScore,
  };
}

