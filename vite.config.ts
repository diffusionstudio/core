import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nodeExternals } from 'rollup-plugin-node-externals'
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  publicDir: command == 'build' ? false : 'public',
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'DiffusionStudio',
      formats: ['es'],
      fileName: 'ds'
    },
    target: 'esnext',
  },
  plugins: [
    dts({
      exclude: ['**/*.spec.ts', '**/tests/*'],
      rollupTypes: true,
      include: ['src']
    }),
    nodeExternals(),
  ],
}));
