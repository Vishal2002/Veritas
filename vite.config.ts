import { defineConfig } from 'vite'; 
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        },
        {
          src: 'public/icons/*',
          dest: 'icons',
        },
      ],
    }),
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',      // Processes HTML + TS/CSS
        background: 'src/background/background.ts',
        content: 'src/content/content.ts',  // Bundles + CSS import
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
          if (name.match(/\.(png|jpg|svg)$/)) return 'icons/[name][extname]';
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
  define: {
    global: 'globalThis',
  },
});