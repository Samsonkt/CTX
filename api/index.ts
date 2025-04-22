// c:\Users\sonof\CTX\server\index.ts
import 'dotenv/config';
import express, { type Request, Response, NextFunction, type Application } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import type { Server } from 'http'; // Import Server type

// Setup app function - exported for Vercel serverless environment
export async function setupApp(app: Application) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Logging Middleware
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
}

// Only run server directly if this file is executed directly (not for Vercel)
if (process.env.VERCEL !== 'true') {
  (async () => {
    const app = express();
    await setupApp(app); // Setup middleware

    // registerRoutes returns the http.Server instance needed locally
    // It also registers API/auth routes onto the 'app' instance
    const server: Server = await registerRoutes(app); // Capture the server instance

    // Error handler (register *after* API routes)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error:", err.stack || err); // Log the error details locally
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "development") {
      log("Setting up Vite Dev Server...");
      // Pass the server instance to setupVite for HMR
      await setupVite(app, server); // setupVite adds Vite middleware and fallback route
    } else {
      log("Setting up static file serving for production build...");
      // Serve static files using Express for local production testing
      // This adds static middleware and the index.html fallback
      serveStatic(app);
    }

    const port = process.env.PORT || 5000;
    // Listen using the server instance returned by registerRoutes
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}

// --- Vercel Handler ---
let cachedApp: Application | null = null;

// This function will be bundled by Vercel into a serverless function
export default async function handler(req: Request, res: Response) {
  // Check if the app instance has already been initialized
  if (!cachedApp) {
    console.log("Initializing Vercel handler app instance..."); // Add log for Vercel context
    const app = express();
    await setupApp(app); // Setup middleware (JSON, URL-encoded, logging)

    // Register API routes. Ignore the returned http.Server instance.
    // registerRoutes modifies the 'app' instance directly.
    await registerRoutes(app);

    // IMPORTANT: DO NOT call serveStatic(app) here.
    // Vercel handles serving static files based on vercel.json config.
    // The serverless function only needs to handle API routes.

    // Add a final catch-all for any requests reaching here that aren't API routes
    // This indicates a potential routing issue in vercel.json or elsewhere.
    app.use((_req, res) => {
        res.status(404).send('API route not found.');
    });

    // Add error handling middleware specifically for the Vercel function
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error("Vercel Handler Error:", err.stack || err);
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
    });


    cachedApp = app; // Cache the initialized app
    console.log("Vercel handler app instance initialized and cached.");
  } else {
    // Optional: Log when using the cached instance
    // console.log("Using cached Vercel handler app instance.");
  }

  // Pass the request to the cached Express app
  return cachedApp(req, res);
}
