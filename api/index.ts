import express from "express";
import { setupApp } from "../server/index";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

// Create a serverless handler for Vercel
export default async function handler(req, res) {
  const app = express();
  setupApp(app);
  
  // Set up routes
  await registerRoutes(app);
  
  // Handle errors
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  
  // Call the express instance with the request and response
  return app(req, res);
}
