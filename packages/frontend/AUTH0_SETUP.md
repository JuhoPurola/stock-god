# Auth0 Setup Guide

This application uses Auth0 for authentication. Follow these steps to configure it:

## 1. Create Auth0 Account

1. Go to [Auth0](https://auth0.com/) and create a free account
2. Create a new tenant (e.g., `your-company.auth0.com`)

## 2. Create Application

1. In Auth0 Dashboard, go to **Applications** > **Create Application**
2. Choose **Single Page Web Applications**
3. Select **React** as the technology

## 3. Configure Application Settings

In your Auth0 application settings:

### Allowed Callback URLs
```
http://localhost:5173, https://your-production-domain.com
```

### Allowed Logout URLs
```
http://localhost:5173, https://your-production-domain.com
```

### Allowed Web Origins
```
http://localhost:5173, https://your-production-domain.com
```

## 4. Configure Environment Variables

### For Local Development

Copy `.env.example` to `.env` and fill in:

```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id-from-auth0
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
```

### For Production

Create `.env.production` with:

```bash
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id-from-auth0
VITE_AUTH0_REDIRECT_URI=https://your-production-domain.com
```

**Important**: Never commit `.env.production` to git!

## 5. Backend Configuration

The backend also needs Auth0 configuration to verify tokens. See the main README for backend setup.

## 6. Test Authentication

1. Start the development server: `pnpm dev`
2. Click "Login" - you should be redirected to Auth0
3. Create an account or login
4. You should be redirected back to the app

## Troubleshooting

### "Invalid redirect_uri"
- Check that your callback URL is added to Auth0 application settings
- Ensure the URL matches exactly (including protocol and port)

### "Failed to fetch user info"
- Check that your Auth0 domain is correct in environment variables
- Verify your client ID matches the Auth0 application

### Token verification fails
- Backend needs to be configured with Auth0 domain
- Check backend logs for JWT verification errors
