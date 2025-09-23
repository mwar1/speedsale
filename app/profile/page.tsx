// app/profile/page.tsx
'use client';

import { SetStateAction, useEffect, Dispatch, useState, type FormEvent } from 'react';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

interface User {
  id: string;
  fname: string;
  sname: string;
  email: string;
  premium: boolean;
  created_at: string;
  profileImageUrl: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch('/api/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const data = await res.json();
      setUser(data.user);
      setIsLoadingUser(false);
    }

    fetchUser();
  }, []);

  if (isLoadingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading your profile…" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md card p-8">
          <h1 className="text-2xl font-semibold tracking-tight">You are not logged in</h1>
          <p className="mt-2 text-sm text-gray-600">Please sign in to view your personalized dashboard and watchlist.</p>
          <Link
            href="/login"
            className="mt-6 btn btn-primary w-full"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  const initials = `${user.fname[0]}${user.sname[0]}`.toUpperCase();

  const memberSince = user ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—';

  return (
    <main className="min-h-screen w-full">
      {/* Top status banner */}
      <div className={`w-full ${user.premium ? 'bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500' : 'bg-gray-200'} `}>
        <div className="mx-auto max-w-4xl px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm font-medium ${user.premium ? 'text-white' : 'text-black'}`}>
              {user.premium ? 'Premium plan — Enjoying all features' : 'Free plan — Upgrade for more features'}
            </p>
            {!user.premium && (
              <a href="/upgrade" className="btn btn-primary">
                Upgrade now
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Your Profile
          </h1>
          <a href="/dashboard" className="btn btn-outline">Back</a>
        </div>

        {/* Combined header card */}
        <section className="mt-6 rounded-2xl bg-white px-6 py-6 shadow-lg">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-200 bg-gray-100 flex items-center justify-center">
                {user.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${user.fname} ${user.sname}`}
                    src={user.profileImageUrl}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-black/80">
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xl font-medium text-black">
                  {user.fname} {user.sname}
                </p>
                <p className="text-sm text-gray-700">{user.email}</p>
                <p className="mt-1 text-xs text-gray-600">User since {memberSince}</p>
              </div>
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </section>

        {/* Editable details section */}
        <EditableDetails
          key={`${user.email}-${user.fname}-${user.sname}`}
          defaultEmail={user.email}
          defaultFirstName={user.fname}
          defaultSurname={user.sname}
          setUser={setUser}
        />
      </div>
    </main>
  );
}

type EditableDetailsProps = {
  defaultFirstName: string;
  defaultSurname: string;
  defaultEmail: string;
  setUser: Dispatch<SetStateAction<User | null>>;
};

function EditableDetails({ defaultFirstName, defaultSurname, defaultEmail, setUser }: EditableDetailsProps) {
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [surname, setSurname] = useState(defaultSurname);
  const [email, setEmail] = useState(defaultEmail);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onCancel = () => {
    setFirstName(defaultFirstName);
    setSurname(defaultSurname);
    setEmail(defaultEmail);
    setError("");
    setIsEditing(false);
  };

  const onSave = async () => {
    setSaving(true);
    
    const res = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_fname: firstName, new_sname: surname, new_email: email }),
      cache: 'no-store',
    });

    const updatedUser = await res.json();
    if (res.ok) {
      setUser(updatedUser.user[0]);

      setIsEditing(false);
    }
    
    if (!res.ok) {
      setError(updatedUser.error);
    }

    setSaving(false);
  };

  return (
    <section className="mt-8 rounded-2xl bg-white px-6 py-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-black">Account details</h2>
          <p className="text-sm text-gray-700">Update your personal information</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn bg-blue-800 text-white hover:bg-blue-900"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className={`btn btn-primary ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}
          <button
            onClick={() => setIsPasswordOpen(true)}
            className="btn bg-blue-500 text-white hover:bg-blue-600"
          >
            Change password
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card px-4 py-4 bg-white">
          <label className="text-xs uppercase tracking-wide text-gray-700">First name</label>
          {isEditing ? (
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2 input"
              placeholder="First name"
            />
          ) : (
            <p className="mt-1 text-sm font-medium text-black">{firstName}</p>
          )}
        </div>
        <div className="card px-4 py-4 bg-white">
          <label className="text-xs uppercase tracking-wide text-gray-700">Surname</label>
          {isEditing ? (
            <input
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="mt-2 input"
              placeholder="Surname"
            />
          ) : (
            <p className="mt-1 text-sm font-medium text-black">{surname}</p>
          )}
        </div>
        <div className="card px-4 py-4 sm:col-span-2 bg-white">
          <label className="text-xs uppercase tracking-wide text-gray-700">Email</label>
          {isEditing ? (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-2 input"
              placeholder="Email address"
            />
          ) : (
            <p className="mt-1 text-sm font-medium text-black">{email}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="sm:col-span-2 mt-4">
          <p className="text-m text-red-600 text-center">{error}</p>
        </div>
      )}
      

      {isPasswordOpen && (
        <PasswordModal onClose={() => setIsPasswordOpen(false)} />
      )}
    </section>
  );
}

type PasswordModalProps = { onClose: () => void };

function PasswordModal({ onClose }: PasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [nextPwd, setNextPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const mismatch = confirm.length > 0 && nextPwd !== confirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    setSubmitting(true);
    
    const res = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_pw: current, new_pw: nextPwd }),
      cache: 'no-store',
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      onClose();
    }

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md card p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Change password</h3>
        <p className="mt-1 text-sm text-gray-700">Enter your current and new password</p>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block text-sm text-gray-700">
            Current password
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-2 input"
              placeholder="••••••••"
              required
            />
          </label>
          {error && (
            <div className="sm:col-span-2 mt-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <label className="block text-sm text-gray-700">
            New password
            <input
              type="password"
              value={nextPwd}
              onChange={(e) => setNextPwd(e.target.value)}
              className="mt-2 input"
              placeholder="Enter your new password"
              required
            />
          </label>
          <label className="block text-sm text-gray-700">
            Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-2 input"
              placeholder="Repeat new password"
              required
            />
            {mismatch && (
              <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
            )}
          </label>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || mismatch}
              className={`btn btn-primary ${submitting || mismatch ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
