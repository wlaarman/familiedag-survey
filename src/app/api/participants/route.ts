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
  const { aantalGroepen, excludeIds = [] } = body;

  if (!aantalGroepen || aantalGroepen < 2) {
    return NextResponse.json({ error: 'Minimaal 2 groepen' }, { status: 400 });
  }

  const participants = await getParticipants();
  const excludeSet = new Set(excludeIds as number[]);

  // Filter out excluded participants, then sort for balanced round-robin
  const toAssign = participants
    .filter(p => !excludeSet.has(p.id))
    .sort((a, b) => {
      if (a.generatie !== b.generatie) return a.generatie - b.generatie;
      if (a.geslacht !== b.geslacht) return a.geslacht.localeCompare(b.geslacht);
      return a.familie.localeCompare(b.familie);
    });

  // Round-robin assignment for included participants
  const assignments: { id: number; groep: number }[] = toAssign.map((p, i) => ({
    id: p.id,
    groep: (i % aantalGroepen) + 1,
  }));

  await updateAllParticipantGroups(assignments);

  // Return updated participants
  const updated = await getParticipants();
  return NextResponse.json(updated);
}
