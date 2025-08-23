// server/index.ts
import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { setupMiddleware } from "./middleware";
import { setupRoutes } from "./routes";
import { connectDB } from "./db";

const app = express();
const server = createServer(app);

const isProduction = process.env.NODE_ENV === "production";
// When EMBED_VITE=1, run Vite in middleware mode (single process on :3000)
const EMBED_VITE = process.env.EMBED_VITE === "1";

// Minimal request logger that ignores Vite/HMR/static noise
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (/^\/(@vite|@react-refresh|src\/|node_modules\/|@fs\/|.*\.map$)/.test(req.path)) return;
    if (req.path === "/favicon.ico") return;
    console.log(`${res.statusCode} ${req.method} ${req.path} ${Date.now() - start}ms`);
  });
  next();
});

// Health endpoint (useful for checks and to ensure no redirect loops)
app.get("/api/health", (_req, res) => res.status(200).send("ok"));

(async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    if (isProduction) process.exit(1);
    else console.log("Continuing in development mode without database...");
  }

  setupMiddleware(app);
  setupRoutes(app);

  if (isProduction) {
    // Prod: serve built client from /dist/public
    serveStatic(app);
  } else if (EMBED_VITE) {
    // Dev (single-process): attach Vite middleware/HMR to this server
    await setupVite(app, server);
  } else {
    // Dev (two-process proxy): Vite runs separately on :5173; no client serving here
    // The vite.config.ts proxies /api -> :3000
  }

  const PORT = Number(process.env.PORT) || 3000;

  // Helpful server timeouts (avoid lingering sockets in dev)
  server.keepAliveTimeout = 61_000; // > typical proxy 60s
  server.headersTimeout = 65_000;

  server.listen(PORT, "0.0.0.0", () => {
    const mode = isProduction
      ? "production"
      : EMBED_VITE
      ? "development (single-process)"
      : "development (proxy)";
    console.log(`Server running on http://localhost:${PORT} in ${mode}`);
    if (!isProduction && !EMBED_VITE) {
      console.log(`Vite dev server: http://localhost:5173 (proxying /api -> :${PORT})`);
    }
  });

  // Graceful shutdown
  const shutdown = (sig: string) => () => {
    console.log(`${sig} received. Shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
})();

// Optional: catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
