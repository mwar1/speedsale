'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== passwordConfirm) {
      setError("Passwords don't match");
      return;
    }

    // Simple front-end validation example
    if (!email || !firstName || !surname || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Call your API route to create user
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, surname, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSuccess('User created successfully!');
      setEmail('');
      setFirstName('');
      setSurname('');
      setPassword('');
      setPasswordConfirm('');
      setTimeout(() => router.push('/login'), 1000);
    } catch {
      setError('Failed to submit. Try again later.');
    }
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-gray-600">Start tracking your favorite shoes.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            required
          />

          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="input"
            required
          />

          <input
            type="text"
            placeholder="Surname"
            value={surname}
            onChange={e => setSurname(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Re-enter password"
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
            className="input"
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Create account
          </button>
        </form>
        </div>
      </div>
    </PageLayout>
  );
}
