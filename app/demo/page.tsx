'use client';

export default function DemoPage() {
  const user = {
    fname: "Demo",
    sname: "User"
  };

  // Placeholder shoe data
  const shoes = [
    {
      id: "1",
      brand: "Nike",
      model: "Vaporfly 4",
      slug: "nike-vaporfly-4"
    },
    {
      id: "2", 
      brand: "Asics",
      model: "Metaspeed Sky Paris",
      slug: "asics-metaspeed-sky-paris"
    },
    {
      id: "3",
      brand: "Adidas", 
      model: "Adios Pro 4",
      slug: "adidas-adios-pro-4"
    },
    {
      id: "4",
      brand: "Hoka",
      model: "Bondi 9", 
      slug: "hoka-bondi-9"
    }
  ];

  const removeFromWatchlist = (shoeId: string) => {
    console.log(`Demo: Would remove shoe ${shoeId} from watchlist`);
  };

  return (
    <main className="min-h-screen">
      {/* Demo Notice */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="container-max py-3">
          <p className="text-sm text-blue-800 text-center">
          ✏️ <strong>Demo Interface:</strong> This is a demonstration. Buttons and links are non-functional.
          </p>
        </div>
      </div>

      {/* Top Banner */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="container-max flex items-center justify-between py-4">
          <div className="flex items-center space-x-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white ring-0 ring-transparent group-hover:ring-2 group-hover:ring-emerald-400 transition">
              {user.fname?.[0]}
            </div>
            <div className="leading-tight">
              <p className="text-sm text-gray-500">Welcome back</p>
              <h1 className="text-base font-semibold">{user.fname} {user.sname}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={() => window.location.href = '/'}
            >
              ← Back to Home
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Profile
            </button>
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
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{item.brand}</p>
                  <p className="mt-0.5 text-base font-semibold tracking-tight">{item.model}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
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
    </main>
  );
}
