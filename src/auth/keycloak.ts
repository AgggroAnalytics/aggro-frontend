import Keycloak from 'keycloak-js';

const { VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID } = import.meta.env;

if (!VITE_KEYCLOAK_URL || !VITE_KEYCLOAK_REALM || !VITE_KEYCLOAK_CLIENT_ID) {
  console.warn(
    '[keycloak] Set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID in .env',
  );
} else if (import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL === VITE_KEYCLOAK_URL) {
  console.warn(
    '[keycloak] VITE_KEYCLOAK_URL совпадает с VITE_API_BASE_URL — /realms/... пойдёт на API и даст 400. Keycloak обычно на другом порту (см. infra/README.md, чаще 8180).',
  );
}

export const keycloak = new Keycloak({
  url: VITE_KEYCLOAK_URL,
  realm: VITE_KEYCLOAK_REALM,
  clientId: VITE_KEYCLOAK_CLIENT_ID,
});

export type KeycloakInitMode = 'login-required' | 'check-sso';

/**
 * Call once before mounting the app.
 * - check-sso: stay on page if not logged in (show Login yourself)
 * - login-required: redirect to Keycloak if no session
 */
export async function initKeycloak(mode: KeycloakInitMode = 'check-sso'): Promise<boolean> {
  const silent =
    typeof window !== 'undefined'
      ? `${window.location.origin}${import.meta.env.BASE_URL}silent-check-sso.html`
      : undefined;

  return keycloak.init({
    onLoad: mode,
    pkceMethod: 'S256',
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: mode === 'check-sso' ? silent : undefined,
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) return undefined;
  try {
    await keycloak.updateToken(60);
  } catch {
    await keycloak.login();
    return undefined;
  }
  return keycloak.token;
}
