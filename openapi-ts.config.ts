import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // Prefer repo OpenAPI on disk; fall back to running API if you change input to http://localhost:8090/openapi.yaml
  input: '../aggro-backend/openapi/openapi.yaml',
  output: 'src/api',
});
