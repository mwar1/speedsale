'use client';

import { ReactNode } from 'react';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <Header user={null} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${className}`}>
      <Header user={user} />
      {children}
    </main>
  );
}
