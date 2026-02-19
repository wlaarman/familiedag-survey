import { NextResponse } from 'next/server';
import { getAllResponses, deleteResponse, updateResponsePhoto, createTables } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    await createTables();
    const responses = await getAllResponses();

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { id, field, url } = await request.json();
    if (!id || !field) {
      return NextResponse.json({ error: 'ID en veld zijn verplicht' }, { status: 400 });
    }

    if (field !== 'foto_1_url' && field !== 'foto_2_url') {
      return NextResponse.json({ error: 'Ongeldig veld' }, { status: 400 });
    }

    await updateResponsePhoto(id, field, url || null);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating response photo:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 });
    }

    await deleteResponse(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
