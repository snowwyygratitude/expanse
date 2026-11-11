import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The whole app builds to a single self-contained dist/index.html so it can be
// hosted anywhere (static host, artifact page, or behind server/server.mjs).
export default defineConfig({
  plugins: [viteSingleFile()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
  build: { target: 'es2020' },
});
