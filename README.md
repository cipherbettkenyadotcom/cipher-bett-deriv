# Cipher Bett AI — secure Deriv OAuth backend

This backend is the next piece needed for the website's Deriv connection.

## Very short setup

1. Create a server on a Node.js host (for example Render, Railway, or another Node host).
2. Upload this folder.
3. Set the environment variables from `.env.example`.
4. In your Deriv OAuth app, register the backend callback URL exactly, e.g. `https://YOUR-BACKEND-DOMAIN/callback`.
5. Change the website's Connect button to open `https://YOUR-BACKEND-DOMAIN/auth/deriv`.

## Security
- Never put CLIENT_SECRET, access tokens, or passwords in frontend code.
- This implementation uses OAuth 2.0 Authorization Code + PKCE.
- It requests only the `trade` scope.
- Test with a demo account first.

The OAuth flow follows Deriv's current official documentation.
