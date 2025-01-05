import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
//import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/app/' : '/',
  server: {
    host: "::", // Listen on all IP addresses
    port: 8080, // Use port 8080 for local development
  },
  plugins: [
    react(), // Use React with SWC for faster builds
     // Apply componentTagger only in development /mode === 'development' ,&& componentTagger()
  ].filter(Boolean), // Remove undefined values from the plugins array
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Simplify imports with aliases
    },
  },
  //base: '/app/', // Set the base path for deployment to a subdirectory
}));