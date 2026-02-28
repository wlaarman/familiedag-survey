import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getKenJeElkaar, addKenJeElkaar, updateKenJeElkaar, deleteKenJeElkaar, swapKenJeElkaarOrder, createTables } from '@/lib/db';

export async function GET() {
  try {
    await createTables();
    const items = await getKenJeElkaar();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to get ken je elkaar:', error);
    return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, answer, type } = await request.json();
    if (!question || !answer) return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });

    const id = await addKenJeElkaar(question, answer, type || 'number');
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Failed to add ken je elkaar:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, question, answer, type } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await updateKenJeElkaar(id, question, answer, type);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update ken je elkaar:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id1, id2 } = await request.json();
    if (!id1 || !id2) return NextResponse.json({ error: 'Missing ids' }, { status: 400 });

    await swapKenJeElkaarOrder(id1, id2);
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

    await deleteKenJeElkaar(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete ken je elkaar:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
