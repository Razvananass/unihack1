import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite builds the React app. Tailwind v4 is added as a Vite plugin (no separate config file needed).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
