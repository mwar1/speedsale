import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Fetch user by email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .single();

    if (error || !users) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Compare password with stored hash
    const validPassword = bcrypt.compare(password, users.password);

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: users.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const cookie = serialize('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
