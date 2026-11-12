import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // MiniPay's embedded browser should not be interrupted by
  // development hot-reload reconnects. Refresh manually after editing.
  server: {
    hmr: false,
  },
});
