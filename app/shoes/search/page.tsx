'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import ShoeImage from '@/components/ShoeImage';

interface Shoe {
  id: string;
  brand: string | null;
  model: string | null;
  slug: string | null;
  image_url: string | null;
  price: number | null;
}

export default function ShoeSearchPage() {
  const [search, setSearch] = useState('');
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [allShoes, setAllShoes] = useState<Shoe[]>([]);
  const [selectedShoe, setSelectedShoe] = useState<Shoe | null>(null);
  const [discount, setDiscount] = useState<number | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchShoes = useCallback(async (query: string) => {
    const res = await fetch(`/api/shoes/search?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    const fetchedShoes = data.shoes || [];
    setAllShoes(fetchedShoes);
    applyFilters(fetchedShoes, query, selectedBrand);
  }, [selectedBrand]);

  // Fetch all shoes initially
  useEffect(() => {
    fetchShoes('');
    fetchWatchlist();
  }, [fetchShoes]);

  const applyFilters = (shoesToFilter: Shoe[], searchQuery: string, brandFilter: string) => {
    let filtered = shoesToFilter;

    // Apply brand filter
    if (brandFilter) {
      filtered = filtered.filter(shoe => shoe.brand === brandFilter);
    }

    setShoes(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedFetch(value);
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brand = e.target.value;
    setSelectedBrand(brand);
    applyFilters(allShoes, search, brand);
  };

  const fetchWatchlist = async () => {
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    setWatchlist(data.watchlist.map((item: { id: string }) => item.id));
  };

  const debouncedFetch = useCallback((query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      fetchShoes(query);
    }, 300);
  }, [fetchShoes]);

  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return 'Price unavailable';
    return `£${price.toFixed(2)}`;
  };

  const getUniqueBrands = (): string[] => {
    const brands = allShoes.map(shoe => shoe.brand).filter((brand): brand is string => brand !== null);
    return [...new Set(brands)].sort();
  };

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

        <div className="mt-4 flex gap-3">
          <select
            value={selectedBrand}
            onChange={handleBrandChange}
            className="input flex-1"
          >
            <option value="">-- Filter by Brand --</option>
            {getUniqueBrands().map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          {selectedBrand && (
            <button
              onClick={() => {
                setSelectedBrand('');
                applyFilters(allShoes, search, '');
              }}
              className="btn btn-outline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="mt-6 max-h-[80vh] overflow-y-auto card p-4">
          <ul className="divide-y divide-gray-200">
            {shoes.map((shoe) => (
              <li key={shoe.id} className="flex items-center gap-4 py-3">
                <ShoeImage imageUrl={shoe.image_url} brand={shoe.brand} model={shoe.model} size="small" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{shoe.brand}</p>
                  <p className="text-base font-medium">{shoe.model}</p>
                  <p className="text-sm font-semibold text-gray-700">{"RRP: " + formatPrice(shoe.price)}</p>
                </div>
                <div className="flex gap-2">
                  {shoe.slug && (
                    <Link
                      href={`/shoes/${shoe.slug}`}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </Link>
                  )}
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
                </div>
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
