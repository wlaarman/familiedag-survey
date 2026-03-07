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

  // Track per-group state: family counts, generatie counts, geslacht counts, total size
  const groups: { familyCount: Map<string, number>; jong: number; oud: number; man: number; size: number }[] =
    Array.from({ length: aantalGroepen }, () => ({ familyCount: new Map(), jong: 0, oud: 0, man: 0, size: 0 }));

  // Sort: largest families first so they get spread first, then by generatie/geslacht
  const sorted = [...toAssign].sort((a, b) => {
    const famSizeA = toAssign.filter(p => p.familie === a.familie).length;
    const famSizeB = toAssign.filter(p => p.familie === b.familie).length;
    if (famSizeA !== famSizeB) return famSizeB - famSizeA; // biggest family first
    if (a.familie !== b.familie) return a.familie.localeCompare(b.familie);
    if (a.generatie !== b.generatie) return a.generatie - b.generatie;
    return a.geslacht.localeCompare(b.geslacht);
  });

  // Greedy assignment: for each person, pick the best group
  const assignments: { id: number; groep: number }[] = [];
  for (const p of sorted) {
    let bestGroup = 0;
    let bestScore = Infinity;

    for (let g = 0; g < aantalGroepen; g++) {
      if (groups[g].size >= maxPerGroep) continue; // full

      const famCount = groups[g].familyCount.get(p.familie) || 0;
      // Primary: balance group sizes (weight 1000)
      // Secondary: minimize family members in same group (weight 100)
      // Tertiary: balance generatie (young/old) within group (weight 1)
      const generatieImbalance = Math.abs(groups[g].jong - groups[g].oud);
      const score =
        groups[g].size * 1000 +
        famCount * 100 +
        generatieImbalance;

      if (score < bestScore) {
        bestScore = score;
        bestGroup = g;
      }
    }

    // Assign to best group
    const grp = groups[bestGroup];
    grp.familyCount.set(p.familie, (grp.familyCount.get(p.familie) || 0) + 1);
    if (p.generatie === 1) grp.jong++;
    if (p.generatie === 2) grp.oud++;
    if (p.geslacht === 'M') grp.man++;
    grp.size++;
    assignments.push({ id: p.id, groep: bestGroup + 1 });
  }

  await updateAllParticipantGroups(assignments);

  // Return updated participants
  const updated = await getParticipants();
  return NextResponse.json(updated);
}
