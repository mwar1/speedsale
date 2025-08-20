'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import debounce from 'lodash.debounce';

interface Shoe {
  id: string;
  brand: string;
  model: string;
  slug: string;
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
    <main className="p-4">
      <Link
        href="/dashboard"
        className="block text-center border border-green-600 text-green-600 py-2 rounded hover:bg-green-50"
      >
        BACK
      </Link>
      <input
        type="text"
        placeholder="Search shoes by brand or model..."
        value={search}
        onChange={handleSearchChange}
        className="w-full p-2 border rounded mb-4"
      />

      <div className="max-h-[500px] overflow-y-auto border rounded p-2">
        <ul className="space-y-2">
          {shoes.map((shoe) => (
            <li key={shoe.id} className="flex justify-between items-center border-b pb-2">
              <Link href={`/shoes/${shoe.slug}`} className="text-blue-600 hover:underline">
                {shoe.brand} {shoe.model}
              </Link>
              {watchlist.includes(shoe.id) ? (
                <button
                  className="ml-2 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => removeFromWatchlist(shoe.id)}
                >
                  Remove from Watchlist
                </button>
              ) : (
                <button
                  className="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={() => openModal(shoe)}
                >
                  Add to Watchlist
                </button>
              )}
            </li>
          ))}
        </ul>
        {shoes.length === 0 && <p>No shoes found.</p>}
      </div>

      {/* Modal */}
      {isModalOpen && selectedShoe && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-96 relative">
            <h2 className="text-lg font-bold mb-4">
              Add {selectedShoe.brand} {selectedShoe.model} to Watchlist
            </h2>
            <label className="block mb-2">
              Discount % you are looking for:
              <input
                type="number"
                min={0}
                max={100}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full p-2 border rounded mt-1"
              />
            </label>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
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
