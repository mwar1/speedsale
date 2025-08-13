import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { supabase } from '@/lib/db'; // adjust your import path

export async function POST(req: NextRequest, res: NextResponse) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method Not Allowed' },
      { status: 405 }
    );
  }

  const { email, firstName, surname, password } = await req.json();

  if (!email || !firstName || !surname || !password) {
    return NextResponse.json(
      { error: 'MMissing required fields' },
      { status: 400 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, fname: firstName, sname: surname, password: hashedPassword }]);

    if (error) {
      return NextResponse.json(
        { error: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Success' },
      { status: 201 }  // set HTTP status here
    );
  } catch (err) {
    return NextResponse.json(
        { error: err },
        { status: 500 }
      );
  }
}
