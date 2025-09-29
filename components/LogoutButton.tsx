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
    // Use client-side Supabase logout
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
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
