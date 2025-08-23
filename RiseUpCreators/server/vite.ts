// server/vite.ts
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger, type InlineConfig } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Force middleware mode + share the same HTTP server for HMR on port 3000
  const inline: InlineConfig = {
    ...viteConfig,
    configFile: false,       // we're injecting the config object directly
    appType: "custom",       // don't auto-handle index.html
    server: {
      ...(viteConfig as any).server,
      middlewareMode: true,
      hmr: { server },
      // allowedHosts not needed in middleware mode
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        // Be loud in dev but don't kill the process
        viteLogger.error(msg, options);
      },
    },
  };

  const vite = await createViteServer(inline);

  // Vite middleware (serves /src modules, HMR, etc.)
  app.use(vite.middlewares);

  // HTML fallback: only handle GETs that accept HTML
  app.use("*", async (req, res, next) => {
    if (req.method !== "GET") return next();
    const accept = req.headers.accept || "";
    if (!accept.toString().includes("text/html")) return next();

    try {
      const url = req.originalUrl;
      const clientIndex = path.resolve(__dirname, "..", "client", "index.html");

      // Always read fresh (so editing index.html in dev reflects immediately)
      let template = await fs.promises.readFile(clientIndex, "utf-8");

      // Tiny cache-bust for the entry if you want it
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(url, template);
      res.status(200).setHeader("Content-Type", "text/html");
      res.end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production we build client into dist/public (per your vite.config.ts)
  const distPublic = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPublic)) {
    throw new Error(
      `Build output not found at ${distPublic}. Did you run "npm run build"?`
    );
  }

  app.use(express.static(distPublic));

  // SPA fallback for client-side routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPublic, "index.html"));
  });
}
