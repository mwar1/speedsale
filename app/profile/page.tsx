// app/profile/page.tsx
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null; // AuthenticatedLayout will handle the loading/auth states

  const initials = `${user.fname[0]}${user.sname[0]}`.toUpperCase();

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—';

  return (
    <AuthenticatedLayout requireAuth={true}>
      <div className="w-full">
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
      </div>
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Your Profile
          </h1>
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
        />

        {/* Email Preferences Section */}
        <EmailPreferences userId={user.id} />
      </div>
    </AuthenticatedLayout>
  );
}

type EditableDetailsProps = {
  defaultFirstName: string;
  defaultSurname: string;
  defaultEmail: string;
};

function EditableDetails({ defaultFirstName, defaultSurname, defaultEmail }: EditableDetailsProps) {
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
      // User data will be refreshed by useAuth hook
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

type EmailPreferencesProps = {
  userId: string;
};

function EmailPreferences({}: EmailPreferencesProps) {
  const [emailFrequency, setEmailFrequency] = useState<string>('immediate');
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [originalEmailFrequency, setOriginalEmailFrequency] = useState<string>('immediate');
  const [originalEmailEnabled, setOriginalEmailEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch user preferences on mount
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch('/api/user/preferences', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          const frequency = data.email_frequency || 'immediate';
          const enabled = data.email_enabled !== false;
          
          setEmailFrequency(frequency);
          setEmailEnabled(enabled);
          setOriginalEmailFrequency(frequency);
          setOriginalEmailEnabled(enabled);
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  // Check if changes have been made
  const hasChanges = emailFrequency !== originalEmailFrequency || emailEnabled !== originalEmailEnabled;

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_frequency: emailFrequency,
          email_enabled: emailEnabled,
        }),
        cache: 'no-store',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save preferences');
      } else {
        // Update original values after successful save
        setOriginalEmailFrequency(emailFrequency);
        setOriginalEmailEnabled(emailEnabled);
      }
    } catch {
      setError('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="mt-8 rounded-2xl bg-white px-6 py-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading email preferences..." />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl bg-white px-6 py-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-black">Email Preferences</h2>
          <p className="text-sm text-gray-700">Control how often you receive price alerts</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Email Enabled Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-black">Email Notifications</label>
            <p className="text-xs text-gray-600">Receive price alerts for your watchlist</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Email Frequency Selection */}
        {emailEnabled && (
          <div>
            <label className="text-sm font-medium text-black">Email Frequency</label>
            <p className="text-xs text-gray-600 mb-3">How often you want to receive price alerts</p>
            <div className="space-y-3">
              {[
                { value: 'immediate', label: 'Immediate', description: 'Get alerts as soon as prices drop' },
                { value: 'daily', label: 'Daily', description: 'Receive a daily summary of price changes' },
                { value: 'weekly', label: 'Weekly', description: 'Get a weekly digest of all price changes' }
              ].map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="emailFrequency"
                    value={option.value}
                    checked={emailFrequency === option.value}
                    onChange={(e) => setEmailFrequency(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <div className="text-sm font-medium text-black">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`btn ${hasChanges ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'} ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center">{error}</div>
        )}
      </div>
    </section>
  );
}
