import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  // Log the user out by clearing the session cookie
  const cookie = serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json(
    { message: 'Logged out' },
    { status: 200, headers: { 'Set-Cookie': cookie } }
  );
}
