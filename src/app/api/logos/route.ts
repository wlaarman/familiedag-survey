import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getCustomLogos, setCustomLogo, deleteCustomLogo, getLogoSelection, saveLogoSelection, createTables } from '@/lib/db';

export async function GET() {
  try {
    // Ensure table exists
    await createTables();

    const [logos, selection] = await Promise.all([getCustomLogos(), getLogoSelection()]);
    return NextResponse.json({ logos, selection });
  } catch (error) {
    console.error('Failed to get custom logos:', error);
    return NextResponse.json({ error: 'Failed to get logos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure table exists
    await createTables();

    const { bedrijfNaam, logoUrl } = await request.json();

    if (!bedrijfNaam || !logoUrl) {
      return NextResponse.json({ error: 'Missing bedrijfNaam or logoUrl' }, { status: 400 });
    }

    await setCustomLogo(bedrijfNaam, logoUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save custom logo:', error);
    return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { selection } = await request.json();
    if (!Array.isArray(selection)) {
      return NextResponse.json({ error: 'Missing selection array' }, { status: 400 });
    }

    await saveLogoSelection(selection);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save logo selection:', error);
    return NextResponse.json({ error: 'Failed to save selection' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bedrijfNaam } = await request.json();

    if (!bedrijfNaam) {
      return NextResponse.json({ error: 'Missing bedrijfNaam' }, { status: 400 });
    }

    await deleteCustomLogo(bedrijfNaam);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete custom logo:', error);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
