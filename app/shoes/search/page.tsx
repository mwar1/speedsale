'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import debounce from 'lodash.debounce';
import ShoeImage from '@/components/ShoeImage';

interface Shoe {
  id: string;
  brand: string | null;
  model: string | null;
  slug: string | null;
  image_url: string | null;
}

export default function ShoeSearchPage() {
  const [search, setSearch] = useState('');
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [selectedShoe, setSelectedShoe] = useState<Shoe | null>(null);
  const [discount, setDiscount] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Fetch all shoes initially
  useEffect(() => {
    fetchShoes('');
    fetchWatchlist();
  }, []);

  const fetchShoes = async (query: string) => {
    const res = await fetch(`/api/shoes/search?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    setShoes(data.shoes || []);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedFetch(value);
  };

  const fetchWatchlist = async () => {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    setWatchlist(data.watchlist.map((item: { id: string }) => item.id));
  };

  const debouncedFetch = debounce(fetchShoes, 300);

  const openModal = (shoe: Shoe) => {
    setSelectedShoe(shoe);
    setDiscount('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShoe(null);
    setDiscount('');
  };

  const addToWatchlist = async () => {
    if (!selectedShoe || discount === '') return;

    await fetch('/api/watchlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shoe_id: selectedShoe.id,
        discount: discount
      }),
    });

    closeModal();
    // Refresh
    fetchWatchlist();
  };

  const removeFromWatchlist = async (shoeId: string) => {
    await fetch('/api/watchlist/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shoe_id: shoeId }),
    });

    // Refresh
    fetchWatchlist();
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="btn btn-outline"
          >
            Back
          </Link>
        </div>

        <div className="mt-6">
          <input
            type="text"
            placeholder="Search shoes by brand or model..."
            value={search}
            onChange={handleSearchChange}
            className="input"
          />
        </div>

        <div className="mt-6 max-h-[520px] overflow-y-auto card p-4">
          <ul className="divide-y divide-gray-200">
            {shoes.map((shoe) => (
              <li key={shoe.id} className="flex items-center gap-4 py-3">
                <ShoeImage imageUrl={shoe.image_url} brand={shoe.brand} model={shoe.model} size="small" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{shoe.brand}</p>
                  <p className="text-base font-medium">{shoe.model}</p>
                </div>
                {watchlist.includes(shoe.id) ? (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeFromWatchlist(shoe.id)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => openModal(shoe)}
                  >
                    Add
                  </button>
                )}
              </li>
            ))}
          </ul>
          {shoes.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-600">No shoes found.</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedShoe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Add {selectedShoe.brand} {selectedShoe.model}</h2>
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
    </main>
  );
}
