import { createClient } from '@/utils/supabase/server';
import { EmailService } from '@/lib/email-service';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();
  let data, error;

  if (code) {
    // Handle code-based confirmation
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
  } else if (token && type === 'signup') {
    // Handle token-based confirmation using verifyOtp with token_hash
    const result = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });
    data = result.data;
    error = result.error;
  } else {
    // No valid confirmation method found
    return NextResponse.redirect(new URL('/error?message=Invalid confirmation link', request.url));
  }

  if (!error && data?.user) {
      // User is now confirmed and session is established
      // Complete user setup in your custom tables if not already done
      const { user } = data;

      // Check if user data already exists in your 'users' table
      const { data: existingUser, error: fetchUserError } = await supabase
        .from('users')
        .select('id, fname, sname, email')
        .eq('id', user.id)
        .single();

      if (fetchUserError && fetchUserError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching existing user:', fetchUserError);
      }

      if (!existingUser) {
        // User does not exist in our custom 'users' table, create it
        if (user.email) {
          const { error: insertUserError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              fname: user.user_metadata?.fname || null,
              sname: user.user_metadata?.sname || null,
              password: '' // Supabase Auth handles passwords
            }]);

          if (insertUserError) {
            console.error('Error inserting user into custom table:', insertUserError);
          }
        }

        // Insert row into preferences table
        const { error: preferences_error } = await supabase
          .from('user_preferences')
          .insert([{ user_id: user.id }]);

        if (preferences_error) {
          console.error('Failed to insert preferences:', preferences_error);
        }

        // Send welcome email after confirmation
        if (user.email) {
          try {
            const emailService = new EmailService();
            const welcomeData = {
              user: {
                id: user.id,
                email: user.email,
                fname: user.user_metadata?.fname || null,
                sname: user.user_metadata?.sname || null,
              },
            };
            await emailService.sendWelcomeEmail(welcomeData);
          } catch (emailError) {
            console.error('Failed to send welcome email after confirmation:', emailError);
          }
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/error', request.url));
}
