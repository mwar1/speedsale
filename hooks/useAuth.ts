import { useState, useEffect } from 'react';

interface User {
  id: string;
  fname: string;
  sname: string;
  email: string;
  premium?: boolean;
  created_at?: string;
  profileImageUrl?: string | null;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return { user, isLoading, error };
}
