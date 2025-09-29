import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface CustomUser {
  id: string;
  fname: string;
  sname: string;
  email: string;
  premium?: boolean;
  created_at?: string;
  profileImageUrl?: string | null;
}

interface UseAuthReturn {
  user: CustomUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!res.ok) {
          setError('Failed to fetch user');
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setUser(data.user);
        setError(null);
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session) {
          // Fetch user data when signed in
          try {
            const res = await fetch('/api/user', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
            });

            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
              setError(null);
            }
          } catch (err) {
            setError('Network error');
          }
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading, error };
}
