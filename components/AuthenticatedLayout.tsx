'use client';

import { ReactNode } from 'react';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

interface AuthenticatedLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

export default function AuthenticatedLayout({ 
  children, 
  requireAuth = false, 
  fallback 
}: AuthenticatedLayoutProps) {
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

  if (requireAuth && !user) {
    if (fallback) {
      return (
        <main className="min-h-screen">
          <Header user={null} />
          {fallback}
        </main>
      );
    }
    
    return (
      <main className="min-h-screen">
        <Header user={null} />
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md card p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Authentication Required</h1>
            <p className="mt-2 text-sm text-gray-600">Please sign in to access this page.</p>
            <a
              href="/login"
              className="mt-6 btn btn-primary w-full"
            >
              Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header user={user} />
      {children}
    </main>
  );
}
