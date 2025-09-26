'use client';

import PageLayout from '@/components/PageLayout';
import ShoeImage from '@/components/ShoeImage';

export default function DemoPage() {

  // Placeholder shoe data
  const shoes = [
    {
      id: "1",
      brand: "Nike",
      model: "Vaporfly 4",
      slug: "nike-vaporfly-4",
      image_url: null
    },
    {
      id: "2", 
      brand: "Asics",
      model: "Metaspeed Sky Paris",
      slug: "asics-metaspeed-sky-paris",
      image_url: null
    },
    {
      id: "3",
      brand: "Adidas", 
      model: "Adios Pro 4",
      slug: "adidas-adios-pro-4",
      image_url: null
    },
    {
      id: "4",
      brand: "Hoka",
      model: "Bondi 9", 
      slug: "hoka-bondi-9",
      image_url: null
    }
  ];

  const removeFromWatchlist = (shoeId: string) => {
    console.log(`Demo: Would remove shoe ${shoeId} from watchlist`);
  };

  return (
    <PageLayout>
      {/* Demo Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="container-max py-3">
          <p className="text-sm text-blue-800 text-center">
          ✏️ <strong>Demo Interface:</strong> This is a demonstration. Buttons and links are non-functional.
          </p>
        </div>
      </div>

      {/* Content */}
      <section className="container-max py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Your Watchlist</h2>
            <p className="mt-1 text-sm text-gray-600">{"Quick access to models you're tracking."}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => console.log('Demo: Would navigate to shoe search')}
          >
            Add shoes
          </button>
        </div>

        {/* Shoe grid */}
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
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => console.log(`Demo: Would view ${item.model}`)}
                  >
                    View
                  </button>
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
      </section>
    </PageLayout>
  );
}
