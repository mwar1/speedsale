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

interface Shoe {
  shoe_id: string;
  brand: string;
  model: string;
  slug: string;
}


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch user
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch('/api/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
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

  // Fetch watchlist when user is known
  useEffect(() => {
    if (!user) return;

    async function fetchWatchlist() {
      const res = await fetch('/api/watchlist', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch watchlist');
        return;
      }

      setShoes(data.watchlist || []);
    }

    fetchWatchlist();
  }, [user]);

  if (!user) {
    return (
      <main className="p-4 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-xl font-bold">You are not logged in.</h1>
        <Link
          href="/login"
          className="mt-4 block w-full text-center border border-green-600 text-green-600 py-2 rounded hover:bg-green-50"
        >
          LOGIN HERE
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Banner */}
      <header className="flex items-center justify-between bg-gray-100 p-4 shadow">
        <Link
          href="/profile"
          className="text-blue-600 font-semibold hover:underline"
        >
          Profile
        </Link>
        <h1 className="text-lg font-bold">Hello {user.fname} {user.sname}</h1>
        <LogoutButton />
      </header>

      {/* Watchlist Section */}
      <section className="flex-grow flex flex-col items-center justify-start p-4">
        <h2 className="text-xl font-semibold mb-4">Your Watchlist</h2>
        <div className="w-full max-w-2xl border rounded-lg p-4 bg-white shadow">
          {shoes.length === 0 ? (
            <p className="text-gray-500">Your watchlist is empty.</p>
          ) : (
            <ul className="space-y-2">
              {shoes.map((item) => (
                <li key={item.shoe_id} className="border-b pb-2">
                  <Link href={`/shoes/${item.slug}`} className="text-blue-600 hover:underline">
                    {item.brand} {item.model}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href="/shoes/search"
          className="block w-full text-center border border-green-600 text-green-600 py-2 rounded hover:bg-green-50"
        >
          ADD TO WATCHLIST
        </Link>
      </section>
    </main>
  );
}
