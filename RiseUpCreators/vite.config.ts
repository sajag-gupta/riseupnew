import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Lazy import optional Replit plugin
let cartographer: any = null;
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cartographer = require("@replit/vite-plugin-cartographer").cartographer();
  } catch {
    cartographer = null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";
const EMBED_VITE = process.env.EMBED_VITE === "1"; // single-port dev (middleware mode)
const VITE_PORT = Number(process.env.VITE_PORT) || 5173;
const API_URL = process.env.API_URL || "http://localhost:5000";

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), ...(cartographer ? [cartographer] : [])],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  root: path.resolve(__dirname, "client"),

  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: EMBED_VITE
    ? {
        host: true,
        allowedHosts: true, // ✅ allow all hosts
      }
    : {
        host: true,
        allowedHosts: true, // ✅ fix Replit blocked host issue
        port: VITE_PORT,
        strictPort: true,
        proxy: {
          "/api": {
            target: API_URL,
            changeOrigin: true,
            secure: false,
          },
        },
        cors: true,
        fs: {
          strict: true,
          allow: [path.resolve(__dirname, "client")],
          deny: ["**/.*"],
        },
      },
});
