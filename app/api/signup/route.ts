import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db';
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
    const supabase = createServerClient();

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fname: firstName,
          sname: surname,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://speedsale.vercel.app'}/api/auth/callback?next=/dashboard`
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Insert additional user data into your custom users table
    // Note: We don't store password here since Supabase Auth handles it
    const { error: userError } = await supabase
      .from('users')
      .insert([{ 
        id: authData.user.id,
        email, 
        fname: firstName, 
        sname: surname,
        password: '' // Empty since Supabase Auth handles passwords
      }]);

    // Insert row into preferences table
    const { error: preferences_error } = await supabase
      .from('user_preferences')
      .insert([{ user_id: authData.user.id }]);

    if (userError) {
      console.error('Failed to insert user data:', userError);
      // Note: User is created in auth but not in our custom table
      // You might want to handle this differently in production
    }

    if (preferences_error) {
      console.error('Failed to insert preferences:', preferences_error);
      // Note: User preferences not created
    }

    // Send welcome email
    try {
      const emailService = new EmailService();
      const welcomeData = {
        user: {
          id: authData.user.id,
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
      { 
        message: 'Success',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          fname: firstName,
          sname: surname
        }
      },
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
