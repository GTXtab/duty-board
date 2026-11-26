import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { defineConfig } from 'vite';

// A single self-contained HTML file can be opened from disk or dropped on any static host.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
});
