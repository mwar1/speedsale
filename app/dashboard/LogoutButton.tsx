'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // Call the logout API route
    await fetch('/api/logout', { method: 'POST' });

    // Redirect to the login page
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded mt-4 hover:bg-red-600"
    >
      Logout
    </button>
  );
}
