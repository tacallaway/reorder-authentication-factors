/**
 * Reads Okta configuration from Vite-injected environment variables.
 */

const issuer = import.meta.env.VITE_OKTA_ISSUER;
const clientId = import.meta.env.VITE_OKTA_CLIENT_ID;
const redirectUri = import.meta.env.VITE_OKTA_REDIRECT_URI;

if (!issuer || !clientId || !redirectUri) {
  throw new Error(
    'Missing Okta configuration. Copy .env.example to .env and fill in ' +
    'VITE_OKTA_ISSUER, VITE_OKTA_CLIENT_ID, and VITE_OKTA_REDIRECT_URI.'
  );
}

export const oktaConfig = {
  issuer,
  clientId,
  redirectUri,
  scopes: ['openid', 'profile', 'email'],
};
