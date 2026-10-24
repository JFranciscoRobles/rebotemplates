// The demo needs no backend: the template is filled in the page, by the same core a server runs.

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { port: 5191, strictPort: true },
});
