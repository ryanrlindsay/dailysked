import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 6173,
    strictPort: true
  },
  preview: {
    port: 6174,
    strictPort: true
  }
});
