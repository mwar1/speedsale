import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user from Supabase (authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('email_frequency, email_enabled')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json(preferences || {
      email_frequency: 'immediate',
      email_enabled: true,
    });
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user from Supabase (authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { email_frequency, email_enabled } = await request.json();

    // Validate email_frequency
    if (email_frequency && !['immediate', 'daily', 'weekly'].includes(email_frequency)) {
      return NextResponse.json({ error: 'Invalid email frequency' }, { status: 400 });
    }

    // Update user preferences
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        email_frequency: email_frequency || 'immediate',
        email_enabled: email_enabled !== false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating user preferences:', updateError);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/user/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
