/// <reference types="vite/client" />

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}

// ---------------------------------------------------------------------------
// Custom Vite environment variables
// ---------------------------------------------------------------------------
interface ImportMetaEnv {
  /** Supabase project URL — required. Set in .env.local */
  readonly VITE_SUPABASE_URL: string | undefined;
  /** Supabase anon/publishable key — required. Set in .env.local */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
