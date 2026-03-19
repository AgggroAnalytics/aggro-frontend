/// <reference types="vite/client" />

import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** When true, route is reachable without Keycloak session (e.g. /login). */
    public?: boolean;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_KEYCLOAK_URL: string;
  readonly VITE_KEYCLOAK_REALM: string;
  readonly VITE_KEYCLOAK_CLIENT_ID: string;
  /** login-required | check-sso (default) */
  readonly VITE_KEYCLOAK_ONLOAD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
