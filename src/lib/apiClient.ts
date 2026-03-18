import { client } from '../api/client.gen';
import { getAccessToken } from '../auth/keycloak';

/**
 * Attach Bearer token from Keycloak to all SDK calls that declare bearer security.
 */
export function configureApiClient(): void {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';
  client.setConfig({
    baseUrl,
    auth: () => getAccessToken(),
  });
}
