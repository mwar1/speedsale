'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from "next/link";
import PasswordInput from '@/components/PasswordInput';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Use client-side Supabase authentication
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || 'Login failed');
        return;
      }

      if (data.user) {
        // On success, redirect to dashboard
        router.push('/dashboard');
      }
    } catch {
      setError('Failed to login. Try again later.');
    }
  }

  return (
    <main className="min-h-screen">
      <Header showAuthButtons={true} />
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back. Please enter your details.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <PasswordInput
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Login
          </button>

          <div className="text-center text-sm text-gray-500">or</div>

          <Link
            href="/signup"
            className="btn btn-outline w-full"
          >
            Create account
          </Link>
        </form>
        </div>
      </div>
    </main>
  );
}
