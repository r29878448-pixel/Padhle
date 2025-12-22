import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cast process to any to resolve "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This is critical to make 'process.env.API_KEY' work in the client-side browser code
      'process.env.API_KEY': JSON.stringify(env.API_KEY) 
    }
  };
});