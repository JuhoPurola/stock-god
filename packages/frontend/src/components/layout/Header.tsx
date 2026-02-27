import { User, LogOut, LogIn } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { AlertBell } from '../alerts/AlertBell';
import ThemeToggle from '../ui/ThemeToggle';

export function Header() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      <div className="flex-1" />

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        {isAuthenticated && <AlertBell />}

        {!isLoading && (
          <>
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
