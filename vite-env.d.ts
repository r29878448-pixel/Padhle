
// Augment the NodeJS namespace to include API_KEY in process.env.
// Using namespace augmentation avoids the "Cannot redeclare block-scoped variable 'process'" error
// by extending the existing environment types instead of declaring a new global variable.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
