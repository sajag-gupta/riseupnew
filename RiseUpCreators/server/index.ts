
import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { setupMiddleware } from "./middleware";
import { setupRoutes } from "./routes";
import { connectDB } from "./db";

const app = express();
const server = createServer(app);

// Connect to MongoDB
connectDB().then(() => {
  console.log("Database connected successfully");
}).catch((error) => {
  console.error("Database connection failed:", error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.log("Continuing in development mode without database...");
  }
});

setupMiddleware(app);
setupRoutes(app);

// Setup Vite or serve static files
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  serveStatic(app);
} else {
  setupVite(app, server);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  const mode = isProduction ? "production" : "development";
  console.log(`Server running on port ${PORT} in ${mode} mode`);
});
