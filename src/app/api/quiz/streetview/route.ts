import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getStreetviewQuiz } from '@/lib/db';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const items = await getStreetviewQuiz();
  return NextResponse.json({ items });
}
