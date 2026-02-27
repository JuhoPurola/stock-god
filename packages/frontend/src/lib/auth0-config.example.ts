/**
 * Auth0 configuration example
 * Copy this file to auth0-config.ts and fill in your values
 * OR set environment variables in .env
 */

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'your-domain.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',
  authorizationParams: {
    redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
    // Note: No audience specified - Auth0 will return encrypted token
    // Backend decodes this without full JWKS verification
  },
  cacheLocation: 'localstorage' as const,
};
