import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getWieVanDe3Manual, addWieVanDe3Manual, updateWieVanDe3Manual, deleteWieVanDe3Manual, swapWieVanDe3ManualOrder, createTables } from '@/lib/db';

export async function GET() {
  try {
    await createTables();
    const items = await getWieVanDe3Manual();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to get wie van de 3 manual:', error);
    return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, name_1, name_2, name_3, correct_index } = await request.json();
    if (!question || !name_1 || !name_2 || !name_3 || correct_index === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const id = await addWieVanDe3Manual(question, name_1, name_2, name_3, correct_index);
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Failed to add wie van de 3 manual:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, question, name_1, name_2, name_3, correct_index } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await updateWieVanDe3Manual(id, question, name_1, name_2, name_3, correct_index);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update wie van de 3 manual:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id1, id2 } = await request.json();
    if (!id1 || !id2) return NextResponse.json({ error: 'Missing ids' }, { status: 400 });

    await swapWieVanDe3ManualOrder(id1, id2);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to swap order:', error);
    return NextResponse.json({ error: 'Failed to swap' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await deleteWieVanDe3Manual(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete wie van de 3 manual:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
