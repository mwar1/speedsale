import Link from 'next/link';
import LogoutButton from './LogoutButton';

interface User {
  fname: string | null;
  sname: string | null;
}

interface HeaderProps {
  user?: User | null;
  showAuthButtons?: boolean;
  className?: string;
  isDemo?: boolean;
}

export default function Header({ 
  user, 
  showAuthButtons = false,
  className = '',
  isDemo = false
}: HeaderProps) {
  return (
    <header className={`sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur ${className}`}>
      <div className="container-max flex items-center justify-between py-4">
        {user ? (
          // Authenticated user header
          <>
            {isDemo ? (
              <div className="flex items-center space-x-3 group cursor-not-allowed opacity-75">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  {user.fname?.[0] || 'U'}
                </div>
                <div className="leading-tight">
                  <p className="text-sm text-gray-500">Welcome back</p>
                  <h1 className="text-base font-semibold">
                    {user.fname || 'User'} {user.sname || ''}
                  </h1>
                </div>
              </div>
            ) : (
              <Link href="/profile" className="flex items-center space-x-3 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white ring-0 ring-transparent group-hover:ring-2 group-hover:ring-emerald-400 transition">
                  {user.fname?.[0] || 'U'}
                </div>
                <div className="leading-tight">
                  <p className="text-sm text-gray-500">Welcome back</p>
                  <h1 className="text-base font-semibold group-hover:underline">
                    {user.fname || 'User'} {user.sname || ''}
                  </h1>
                </div>
              </Link>
            )}
            <div className="flex items-center space-x-3">
              {isDemo ? (
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm cursor-not-allowed opacity-75"
                  disabled
                >
                  Profile
                </button>
              ) : (
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  Profile
                </Link>
              )}
              {isDemo ? (
                <button
                  className="btn btn-danger btn-sm cursor-not-allowed opacity-75"
                  disabled
                >
                  Logout
                </button>
              ) : (
                <LogoutButton />
              )}
            </div>
          </>
        ) : (
          // Guest user header
          <>
            <Link href="/" className="flex items-center space-x-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold tracking-tight text-white">SS</span>
              <span className="text-base font-semibold tracking-tight">SpeedSale</span>
            </Link>
            {showAuthButtons && (
              <nav className="flex items-center gap-3">
                <Link href="/login" className="btn btn-outline btn-sm">Log in</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">Get started</Link>
              </nav>
            )}
          </>
        )}
      </div>
    </header>
  );
}
