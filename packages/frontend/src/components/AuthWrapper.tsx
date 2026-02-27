/**
 * Auth wrapper that syncs Auth0 state with API client
 */

import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiClient } from '../lib/api-client';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, getAccessTokenSilently, user, isLoading } = useAuth0();

  useEffect(() => {
    const setupAuth = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently();
          apiClient.setAuth(token, user.sub || '');
        } catch (error) {
          console.error('Failed to get access token:', error);
        }
      } else {
        apiClient.clearAuth();
      }
    };

    if (!isLoading) {
      setupAuth();
    }
  }, [isAuthenticated, user, getAccessTokenSilently, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
