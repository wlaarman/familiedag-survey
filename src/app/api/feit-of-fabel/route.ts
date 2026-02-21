import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getFeitOfFabel, addFeitOfFabel, updateFeitOfFabel, deleteFeitOfFabel, createTables } from '@/lib/db';

export async function GET() {
  try {
    await createTables();
    const items = await getFeitOfFabel();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to get feit of fabel:', error);
    return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { stelling, is_waar } = await request.json();
    if (!stelling) return NextResponse.json({ error: 'Missing stelling' }, { status: 400 });

    const id = await addFeitOfFabel(stelling, is_waar ?? true);
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Failed to add feit of fabel:', error);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, stelling, is_waar } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await updateFeitOfFabel(id, stelling, is_waar);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update feit of fabel:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await deleteFeitOfFabel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete feit of fabel:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
