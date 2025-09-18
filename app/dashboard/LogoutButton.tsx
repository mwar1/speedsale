'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', cache: 'no-store' });
    router.replace('/');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="btn btn-danger btn-sm">
      Logout
    </button>
  );
}
