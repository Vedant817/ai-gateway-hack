'use client';

import { PuzzleInstance } from '@/types/game';

interface PuzzleInfoProps {
  puzzle: PuzzleInstance;
}

export default function PuzzleInfo({ puzzle }: PuzzleInfoProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm text-black">
      <div>
        <h3 className="text-lg font-semibold">Puzzle Details</h3>
        <div className="mt-2 flex gap-2">
          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            {puzzle.difficulty.toUpperCase()}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-black">
            {puzzle.type.replace('-', ' ')}
          </span>
        </div>
      </div>

      {puzzle.persona && (
        <div className="rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">{puzzle.persona.icon}</span>
            <div>
              <div className="font-semibold">{puzzle.persona.name}</div>
              <div className="text-sm text-black">{puzzle.persona.role}</div>
            </div>
          </div>
          <div className="text-sm text-black">
            <div className="font-medium mb-1">Scenario:</div>
            <div>{puzzle.persona.scenario}</div>
            <div className="font-medium mt-2 mb-1">Use Case:</div>
            <div>{puzzle.persona.useCase}</div>
          </div>
        </div>
      )}

      <div>
        <h4 className="font-medium">Objective</h4>
        <p className="text-sm text-black">{puzzle.objective}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Participants:</span>{' '}
          <span className="text-black">{puzzle.participants.length}</span>
        </div>
        <div>
          <span className="font-medium">Meetings:</span>{' '}
          <span className="text-black">{puzzle.meetings.length}</span>
        </div>
        <div>
          <span className="font-medium">Max Concurrent:</span>{' '}
          <span className="text-black">{puzzle.constraints.maxConcurrentMeetings}</span>
        </div>
        <div>
          <span className="font-medium">Min Break:</span>{' '}
          <span className="text-black">{puzzle.constraints.minBreakBetweenMeetings}min</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium">Participants</h4>
        <div className="mt-2 space-y-1 text-sm">
          {puzzle.participants.map((p) => (
            <div key={p.id} className="text-black">
              {p.name}: {p.availableSlots.length} available slots
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-medium">Meetings</h4>
        <div className="mt-2 space-y-1 text-sm">
          {puzzle.meetings.map((m) => (
            <div key={m.id} className="text-black">
              <span className="font-medium">{m.name}</span> ({m.duration}min, {m.priority} priority)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

