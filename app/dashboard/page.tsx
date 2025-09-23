'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from "next/link";
import ShoeImage from '@/components/ShoeImage';

interface User {
  id: string;
  fname: string;
  sname: string;
  email: string;
}

interface Shoe {
  id: string;
  brand: string | null;
  model: string | null;
  slug: string | null;
  image_url: string | null;
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
      const res = await fetch('/api/user', {
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
        <LoadingSpinner text="Loading your dashboard…" />
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
      <Header user={user} />

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
                <div className="flex gap-4 mb-4">
                  <ShoeImage imageUrl={item.image_url} brand={item.brand} model={item.model} size="medium" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{item.brand}</p>
                    <p className="mt-0.5 text-base font-semibold tracking-tight">{item.model}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
