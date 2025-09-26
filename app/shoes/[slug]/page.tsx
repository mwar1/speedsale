'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ShoeImage from '@/components/ShoeImage';
import PageLayout from '@/components/PageLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

interface PriceData {
  price: number | null;
  original_price: number | null;
  discount_percentage: number | null;
  date: string;
  retailer_id: string | null;
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
  price: number | null; // RRP from shoes table
  created_at: string;
  last_scraped: string | null;
  latestPrice: PriceData | null;
  priceHistory: PriceData[];
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
  const { user } = useAuth();
  
  const [shoe, setShoe] = useState<Shoe | null>(null);
  const [isLoadingShoe, setIsLoadingShoe] = useState<boolean>(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discount, setDiscount] = useState<number | ''>('');


  // Fetch watchlist data
  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const res = await fetch('/api/watchlist');
        if (res.ok) {
          const data = await res.json();
          setWatchlist(data.watchlist.map((item: { id: string }) => item.id));
        }
      } catch (error) {
        console.error('Failed to fetch watchlist:', error);
      }
    }

    fetchWatchlist();
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

  const openModal = () => {
    setDiscount('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDiscount('');
  };

  const addToWatchlist = async () => {
    if (!shoe || discount === '') return;

    await fetch('/api/watchlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shoe_id: shoe.id,
        discount: discount
      }),
    });

    closeModal();
    // Refresh watchlist
    const res = await fetch('/api/watchlist');
    if (res.ok) {
      const data = await res.json();
      setWatchlist(data.watchlist.map((item: { id: string }) => item.id));
    }
  };

  const removeFromWatchlist = async () => {
    if (!shoe) return;

    await fetch('/api/watchlist/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shoe_id: shoe.id }),
    });

    // Refresh watchlist
    const res = await fetch('/api/watchlist');
    if (res.ok) {
      const data = await res.json();
      setWatchlist(data.watchlist.map((item: { id: string }) => item.id));
    }
  };

  if (isLoadingShoe) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner text="Loading shoe details..." />
        </div>
      </PageLayout>
    );
  }

  if (!shoe) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Shoe not found</h1>
            <p className="mt-2 text-gray-600">The shoe you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6">
        <div className="mx-auto max-w-4xl">
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

              {/* Current Price and Discount */}
              {shoe.latestPrice && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600">Current Price</span>
                      <div className="text-2xl font-bold text-green-600">£{shoe.latestPrice.price?.toFixed(2) || 'N/A'}</div>
                    </div>
                    {shoe.latestPrice.discount_percentage && shoe.latestPrice.discount_percentage > 0 && (
                      <div className="text-right">
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          -{shoe.latestPrice.discount_percentage.toFixed(0)}% OFF
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RRP */}
              {shoe.price && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">RRP</span>
                    <span className="text-xl font-semibold text-blue-600">£{shoe.price.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Price Comparison - Only show if discounted */}
              {shoe.latestPrice && shoe.price && shoe.latestPrice.price && shoe.latestPrice.price < shoe.price && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">You Save</span>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        £{(shoe.price - shoe.latestPrice.price).toFixed(2)}
                      </div>
                      {shoe.latestPrice.discount_percentage && (
                        <div className="text-sm text-green-700">
                          ({shoe.latestPrice.discount_percentage.toFixed(0)}% off)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Watchlist Button */}
              {user && (
                <div className="mb-6">
                  {watchlist.includes(shoe.id) ? (
                    <button
                      className="btn btn-danger w-full"
                      onClick={removeFromWatchlist}
                    >
                      Remove from Watchlist
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary w-full"
                      onClick={openModal}
                    >
                      Add to Watchlist
                    </button>
                  )}
                </div>
              )}

              {shoe.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{shoe.description}</p>
                </div>
              )}

              {/* Price History */}
              {shoe.priceHistory && shoe.priceHistory.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-3">Price History</h2>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {shoe.priceHistory.slice(0, 10).map((price, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">£{price.price?.toFixed(2) || 'N/A'}</span>
                          {price.discount_percentage && price.discount_percentage > 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                              -{price.discount_percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 text-xs">
                          {formatDate(price.date)}
                        </span>
                      </div>
                    ))}
                  </div>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Add {shoe?.brand} {shoe?.model} to Watchlist</h2>
            <label className="mt-4 block text-sm text-gray-700">
              Discount % you are looking for
              <input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="mt-2 input"
              />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="btn btn-outline"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${
                  discount === '' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={addToWatchlist}
                disabled={discount === ''}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
