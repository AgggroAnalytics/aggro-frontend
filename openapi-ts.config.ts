import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8090/openapi.yaml',
  output: 'src/api',
});
