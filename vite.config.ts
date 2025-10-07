import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    },
    plugins: [
      viteStaticCopy({
        targets: [
          { src: 'public/manifest.json', dest: '.' },
          { src: 'public/icons/*', dest: 'icons' },
        ],
      }),
    ],
    build: {
      target: 'es2022',
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/popup.html'),
          background: resolve(__dirname, 'src/background/background.ts'),
          content: resolve(__dirname, 'src/content/content.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            const base = chunkInfo.facadeModuleId || '';
            if (base.includes('background')) return 'background.js';
            if (base.includes('content')) return 'content.js';
            if (base.includes('popup')) return 'popup.js';
            return 'assets/[name].[hash].js';
          },
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            if (name.endsWith('.css')) {
              if (name.includes('content')) return 'content.css';
              if (name.includes('popup')) return 'popup.css';
            }
            if (name.endsWith('.html')) {
              if (name.includes('popup')) return 'popup.html'; // ← ADD THIS
            }
            return 'assets/[name].[hash].[ext]';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  };
});