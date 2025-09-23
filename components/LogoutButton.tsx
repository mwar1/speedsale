'use client';

import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LogoutButton({ 
  className = 'btn btn-danger btn-sm',
  size = 'sm'
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', cache: 'no-store' });
    router.replace('/');
    router.refresh();
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  return (
    <button 
      onClick={handleLogout} 
      className={`btn btn-danger ${sizeClasses[size]} ${className}`}
    >
      Logout
    </button>
  );
}
