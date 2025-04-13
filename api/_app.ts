import express, { Request, Response } from 'express';
import { setupApp } from '../server/index';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';

// Create an Express app instance
const app = express();

// Set up the app with middleware
setupApp(app);

// Register API routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export a handler function for Vercel
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
