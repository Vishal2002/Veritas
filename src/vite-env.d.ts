/// <reference types="vite/client" />

// Add if using aliases (optional, from your config)
declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
  }
  
  // Key: Declare CSS modules (fixes the import error)
  declare module '*.css' {
    const content: { [key: string]: string };
    export default content;
  }
  
  // Optional: For icons/PNGs if needed
  declare module '*.png' {
    const src: string;
    export default src;
  }