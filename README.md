# aggro-frontend

Vue 3 + Vite + Keycloak (PKCE) + OpenAPI client.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Keycloak

1. Realm (e.g. `aggro`).
2. Client **public**, **Standard flow**, **PKCE** (S256).
3. **Valid redirect URIs:** `http://localhost:5173/*` (и прод-домен).
4. **Web origins:** `http://localhost:5173` (CORS для прямых запросов к Keycloak).

`VITE_KEYCLOAK_URL` — **только** базовый URL Keycloak (без `/realms/...`). Не подставляйте сюда URL HTTP API: иначе iframe `3p-cookies/step1.html` уйдёт на бэкенд и вернёт **400**. Keycloak в Tilt/k8s — **8180**; HTTP API в кластере — **8080**, локально часто **8090** (`VITE_API_BASE_URL`) — см. `infra/README.md`.

Бэкенд (`KEYCLOAK_ISSUER`, `KEYCLOAK_JWKS_URI`) должен валидировать токены того же realm.

## Как устроено

- `src/auth/keycloak.ts` — инициализация `keycloak-js`, `check-sso` + `public/silent-check-sso.html`.
- `src/lib/apiClient.ts` — `client.setConfig({ auth: () => getAccessToken() })` для сгенерированного `@hey-api` клиента.
- Роутер: публичная `/login`, остальное только после сессии Keycloak.

## OpenAPI

```bash
npm run openapi-ts
```

(`openapi-ts.config.ts` — URL спеки бэка.)
