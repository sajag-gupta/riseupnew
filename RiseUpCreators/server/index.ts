import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureCloudinary } from "./services/cloudinary";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for development
    crossOriginEmbedderPolicy: false,
  })
);

// Enable trust proxy for rate limiting in Replit environment
app.set("trust proxy", 1);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : ["http://localhost:5173", "http://localhost:5000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
});

app.use("/api/auth", authLimiter);

(async () => {
  // Initialize Cloudinary after env vars are loaded
  configureCloudinary();

  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error ${status}: ${message}`);

    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    res.status(status).json({
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Rise Up Creators server running on port ${port}`);
    log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
    log(`✅ MongoDB: Connected to Atlas (riseup4 database)`);
    log(
      `☁️  Cloudinary: ${
        process.env.CLOUDINARY_CLOUD_NAME || "dmt03mwbi"
      } - Configured`
    );
    log(
      `💳 Razorpay: ${
        process.env.RAZORPAY_KEY_ID ? "Configured" : "Using test keys"
      }`
    );
    log(
      `📧 SMTP: ${process.env.SMTP_HOST || "smtp.gmail.com"} - Configured`
    );
    log(
      `🔐 JWT Secret: ${
        process.env.SESSION_SECRET
          ? "Custom secret configured"
          : "Using default secret"
      }`
    );
  });
})();
