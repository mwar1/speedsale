'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Link from "next/link";

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
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // On success, redirect (adjust target page as needed)
      router.push('/dashboard');
    } catch {
      setError('Failed to login. Try again later.');
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded space-y-4">
      <h2 className="text-xl font-bold">Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        LOGIN
      </button>
      <div className="text-center my-4 font-semibold text-gray-500">OR</div>

      <Link
        href="/signup"
        className="block w-full text-center border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50"
      >
        CREATE ACCOUNT
      </Link>
    </form>
    </>
  );
}
