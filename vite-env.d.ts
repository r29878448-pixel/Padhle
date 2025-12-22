// Fixed: Removed 'vite/client' reference as it was causing a "Cannot find type definition file" error in this environment.
// Fixed: Changed 'declare const process' to 'declare var process' to resolve "Cannot redeclare block-scoped variable" conflict with existing global process definitions.
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};
