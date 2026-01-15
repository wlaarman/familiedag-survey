import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, deleteSession, verifyPassword, SESSION_COOKIE_NAME } from '@/lib/auth';
import { createTables } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await createTables();

    const { password } = await request.json();

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: 'Ongeldig wachtwoord' },
        { status: 401 }
      );
    }

    const token = await createSession();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteSession(token);
      cookieStore.delete(SESSION_COOKIE_NAME);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}
