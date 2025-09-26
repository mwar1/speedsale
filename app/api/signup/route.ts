import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db';
import { EmailService } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method Not Allowed' },
      { status: 405 }
    );
  }

  const { email, firstName, surname, password } = await req.json();

  if (!email || !firstName || !surname || !password) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ email, fname: firstName, sname: surname, password: hashedPassword }])
      .select('id')
      .single();

    // Insert row into preferences table
    const { error: preferences_error } = await supabase
      .from('user_preferences')
      .insert([{ user_id: user?.id }]);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (preferences_error) {
      return NextResponse.json(
        { error: preferences_error.message },
        { status: 500 }
      );
    }

    // Send welcome email
    try {
      const emailService = new EmailService();
      const welcomeData = {
        user: {
          id: user.id,
          email: email,
          fname: firstName,
          sname: surname,
        },

      };
      await emailService.sendWelcomeEmail(welcomeData);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json(
      { message: 'Success' , user: user.id },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
        { error: message },
        { status: 500 }
      );
  }
}
