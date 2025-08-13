'use client';

import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import Link from "next/link";

interface User {
  id: string;
  fname: string;
  sname: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch('/api/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // optional: ensure fresh data
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to fetch user');
        return;
      }

      const data = await res.json();
      setUser(data.user);
    }

    fetchUser();
  }, []);

  return (
    <main className="p-4">
      {user ? (
        <>
          <h1 className="text-xl font-bold">Hello {user.fname} {user.sname}</h1>
          <LogoutButton />
        </>
      ) : (
        <>

        <h1 className="text-xl font-bold">You are not logged in.</h1>
        <Link
        href="/login"
          className="block w-full text-center border border-green-600 text-green-600 py-2 rounded hover:bg-green-50"
        >
          LOGIN HERE
        </Link>

        </>
      )}
    </main>
  );
}
