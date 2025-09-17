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
      className="btn btn-danger btn-sm"
    >
      Logout
    </button>
  );
}
