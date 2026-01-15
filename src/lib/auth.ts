import { cookies } from 'next/headers';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await sql`
    INSERT INTO admin_sessions (session_token, expires_at)
    VALUES (${token}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function validateSession(token: string): Promise<boolean> {
  const result = await sql`
    SELECT * FROM admin_sessions
    WHERE session_token = ${token}
    AND expires_at > NOW()
  `;
  return result.rows.length > 0;
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM admin_sessions WHERE session_token = ${token}`;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return validateSession(token);
}

export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return password === adminPassword;
}

export { SESSION_COOKIE_NAME };
