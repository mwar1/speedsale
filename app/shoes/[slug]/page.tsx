'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ShoeImage from '@/components/ShoeImage';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

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
  description: string | null;
  category: string | null;
  gender: string | null;
  price: number | null;
  created_at: string;
  last_scraped: string | null;
}

// Helper function to format date as "1st Jan 2024"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  
  // Add ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
}

export default function ShoePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [shoe, setShoe] = useState<Shoe | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isLoadingShoe, setIsLoadingShoe] = useState<boolean>(true);

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // User not authenticated, continue without user data
      } finally {
        setIsLoadingUser(false);
      }
    }

    fetchUser();
  }, []);

  // Fetch shoe data
  useEffect(() => {
    async function fetchShoe() {
      try {
        const res = await fetch(`/api/shoes/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setShoe(data.shoe);
        }
      } catch (error) {
        console.error('Failed to fetch shoe:', error);
      } finally {
        setIsLoadingShoe(false);
      }
    }

    if (slug) {
      fetchShoe();
    }
  }, [slug]);

  if (isLoadingUser || isLoadingShoe) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading shoe details..." />
      </main>
    );
  }

  if (!shoe) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Shoe not found</h1>
          <p className="mt-2 text-gray-600">The shoe you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header user={user} />
      <div className="p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <ShoeImage imageUrl={shoe.image_url} brand={shoe.brand} model={shoe.model} size="large" />
            </div>
            <div className="card p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">{shoe.brand} {shoe.model}</h1>
                {shoe.category && (
                  <p className="mt-1 text-sm text-gray-500">{shoe.category}</p>
                )}
              </div>

              {shoe.price && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="text-2xl font-bold text-green-600">£{shoe.price.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {shoe.price && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">RRP</span>
                    <span className="text-xl font-semibold text-blue-600">£{(shoe.price * 1.2).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {shoe.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{shoe.description}</p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Product Information</h3>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Brand</dt>
                    <dd className="font-medium">{shoe.brand || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Model</dt>
                    <dd className="font-medium">{shoe.model || 'N/A'}</dd>
                  </div>
                  {shoe.category && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Category</dt>
                      <dd className="font-medium">{shoe.category}</dd>
                    </div>
                  )}
                  {shoe.gender && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Gender</dt>
                      <dd className="font-medium capitalize">{shoe.gender}</dd>
                    </div>
                  )}
                  {shoe.last_scraped && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="font-medium">{formatDate(shoe.last_scraped)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
