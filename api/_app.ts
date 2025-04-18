<<<<<<< HEAD
// Vercel API handler
import express, { Request, Response } from 'express';
import { setupApp } from '../server/index';
import { registerRoutes } from '../server/routes';

// Create an Express app instance
const app = express();

// Set up the app with middleware
setupApp(app);

// Register API routes
registerRoutes(app);

// Export a handler function for Vercel
export default async function handler(req: Request, res: Response) {
  return app(req, res);
=======
// Example serverless API endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({ message: "API _app is working!" });
>>>>>>> 2f0d1f0ecab4bf72f122ee9bc0ff7a0e0756936b
}