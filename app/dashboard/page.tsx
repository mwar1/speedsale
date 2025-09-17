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
  id: string;
  brand: string;
  model: string;
  slug: string;
}


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState<boolean>(false);

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
        setIsLoadingUser(false);
        return;
      }

      const data = await res.json();
      setUser(data.user);
      setIsLoadingUser(false);
    }

    fetchUser();
  }, []);

  async function fetchWatchlist() {
    setIsLoadingWatchlist(true);
    const res = await fetch('/api/watchlist', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to fetch watchlist');
      setIsLoadingWatchlist(false);
      return;
    }

    setShoes(data.watchlist || []);
    setIsLoadingWatchlist(false);
  }

  // Fetch watchlist when user is known
  useEffect(() => {
    if (!user) return;

    fetchWatchlist();
  }, [user]);

  const removeFromWatchlist = async (shoeId: string) => {
    console.log(shoeId)
    await fetch('/api/watchlist/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shoe_id: shoeId }),
    })

    fetchWatchlist();
  };

  if (isLoadingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-600">
          <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          <span className="text-sm">Loading your dashboard…</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">You are not logged in</h1>
          <p className="mt-2 text-sm text-gray-600">Please sign in to view your personalized dashboard and watchlist.</p>
          <Link
            href="/login"
            className="mt-6 btn btn-primary w-full"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Top Banner */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="container-max flex items-center justify-between py-4">
          <Link href="/profile" className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white ring-0 ring-transparent group-hover:ring-2 group-hover:ring-emerald-400 transition">
              {user.fname?.[0]}
            </div>
            <div className="leading-tight">
              <p className="text-sm text-gray-500">Welcome back</p>
              <h1 className="text-base font-semibold group-hover:underline">{user.fname} {user.sname}</h1>
            </div>
          </Link>
          <div className="flex items-center space-x-3">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Profile
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="container-max py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your Watchlist</h2>
            <p className="mt-1 text-sm text-gray-600">{"Quick access to models you're tracking."}</p>
          </div>
          <Link
            href="/shoes/search"
            className="btn btn-primary"
          >
            Add shoes
          </Link>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 card border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoadingWatchlist ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, idx) => (
              <li key={idx} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
                <div className="mt-6 h-9 w-full rounded bg-gray-200" />
              </li>
            ))}
          </ul>
        ) : shoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">👟</div>
            <p className="mt-3 text-base font-medium">Your watchlist is empty</p>
            <p className="mt-1 text-sm text-gray-600">Start tracking prices for your favorite models.</p>
            <Link
              href="/shoes/search"
              className="mt-6 btn btn-primary"
            >
              Discover shoes
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shoes.map((item) => (
              <li key={item.id} className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{item.brand}</p>
                  <p className="mt-0.5 text-base font-semibold tracking-tight">{item.model}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/shoes/${item.slug}`}
                    className="btn btn-outline btn-sm"
                  >
                    View
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeFromWatchlist(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
