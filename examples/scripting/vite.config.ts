import dynamicImport from 'vite-plugin-dynamic-import';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [dynamicImport()]
});
