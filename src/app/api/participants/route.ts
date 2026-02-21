import { NextRequest, NextResponse } from 'next/server';
import { getParticipants, updateParticipant, updateParticipantGroup, updateAllParticipantGroups } from '@/lib/db';

export async function GET() {
  const participants = await getParticipants();
  return NextResponse.json(participants);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  if ('groep' in fields) {
    await updateParticipantGroup(id, fields.groep);
  } else {
    await updateParticipant(id, fields);
  }

  return NextResponse.json({ success: true });
}

// POST: auto-assign groups
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { maxPerGroep, excludeIds = [] } = body;

  if (!maxPerGroep || maxPerGroep < 2) {
    return NextResponse.json({ error: 'Minimaal 2 per groep' }, { status: 400 });
  }

  const participants = await getParticipants();
  const excludeSet = new Set(excludeIds as number[]);

  const toAssign = participants.filter(p => !excludeSet.has(p.id));
  const aantalGroepen = Math.ceil(toAssign.length / maxPerGroep);

  // Group by family, then interleave to maximize family spread
  const byFamily = new Map<string, typeof toAssign>();
  for (const p of toAssign) {
    if (!byFamily.has(p.familie)) byFamily.set(p.familie, []);
    byFamily.get(p.familie)!.push(p);
  }

  // Within each family, sort by generatie then geslacht for secondary balance
  for (const members of byFamily.values()) {
    members.sort((a, b) => {
      if (a.generatie !== b.generatie) return a.generatie - b.generatie;
      return a.geslacht.localeCompare(b.geslacht);
    });
  }

  // Interleave: pick one from each family in rotation (round-robin across families)
  const familyQueues = [...byFamily.values()].sort((a, b) => b.length - a.length);
  const interleaved: typeof toAssign = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const queue of familyQueues) {
      if (queue.length > 0) {
        interleaved.push(queue.shift()!);
        remaining = remaining || queue.length > 0;
      }
    }
  }

  // Assign round-robin over groups — family members are spread because they're interleaved
  const assignments: { id: number; groep: number }[] = interleaved.map((p, i) => ({
    id: p.id,
    groep: (i % aantalGroepen) + 1,
  }));

  await updateAllParticipantGroups(assignments);

  // Return updated participants
  const updated = await getParticipants();
  return NextResponse.json(updated);
}
