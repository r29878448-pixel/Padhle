// Fixed: Removed 'vite/client' reference as it was causing a "Cannot find type definition file" error in this environment.
// Fixed: Removed the redundant 'process' variable declaration to resolve the "Cannot redeclare block-scoped variable" conflict.
// As the global 'process' variable is already defined by the environment (e.g., Node.js types), we augment the interfaces instead of redeclaring the variable.
interface ProcessEnv {
  API_KEY: string;
  [key: string]: string | undefined;
}

interface Process {
  env: ProcessEnv;
}
